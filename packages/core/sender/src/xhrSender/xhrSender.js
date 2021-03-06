// @flow
import { logger, FILE_STATES, request, parseResponseHeaders, pick, merge } from "@rpldy/shared";
import { XHR_SENDER_TYPE } from "../consts";
import MissingUrlError from "../MissingUrlError";
import prepareFormData from "./prepareFormData";

import type {
	BatchItem,
	UploadData,
} from "@rpldy/shared";

import type { OnProgress, SendResult, SendOptions, XhrSendConfig } from "../types";

type Headers = { [string]: string };

type SendRequest = {
	url: string,
	count: number,
	pXhr: Promise<XMLHttpRequest>,
	getXhr: () => XMLHttpRequest,
	aborted: boolean,
};

export const SUCCESS_CODES = [200, 201, 202, 203, 204];

const getRequestData = (items: BatchItem[], options: SendOptions) => {
	let data;

	if (options.sendWithFormData) {
		logger.debugLog(`uploady.sender: sending ${items.length} item(s) as form data`);
		data = prepareFormData(items, options);
	} else {
		if (items.length > 1) {
			throw new Error(`XHR Sender - Request without form data can only contain 1 item. received ${items.length}`);
		}

		const item = items[0];
		logger.debugLog(`uploady.sender: sending item ${item.id} as request body`);
		data = item.file || item.url;
	}

	return data;
};

const makeRequest = (items: BatchItem[], url: string, options: SendOptions, onProgress: ?OnProgress, config: ?XhrSendConfig): SendRequest => {
    let xhr;

    const data = config?.getRequestData ?
        config.getRequestData(items, options) :
        getRequestData(items, options);

    const issueRequest = (requestUrl = url, requestData = data, requestOptions) => {
        requestOptions = merge({
            ...pick(options, ["method", "headers", "withCredentials"]),
            preSend: (req) => {
                req.upload.onprogress = (e) => {
                    if (e.lengthComputable && onProgress) {
                        onProgress(e, items.slice());
                    }
                };
            },
        }, requestOptions);

	    const realPXhr = request(requestUrl, requestData, requestOptions);
        // $FlowFixMe -
	    xhr = realPXhr.xhr;

        return realPXhr;
    };

    //pXhr is a promise that resolves to the upload XHR
	const pXhr = config?.preRequestHandler ?
        config.preRequestHandler(issueRequest, items, url, options, onProgress, config) :
        issueRequest();

	return {
		url,
		count: items.length,
		pXhr,
		getXhr: () => xhr,
		aborted: false,
	};
};

const parseResponseJson = (response: string, headers: ?Headers, options: SendOptions): string | Object => {
	let parsed = response;

	const ct = headers && headers["content-type"];

	if (options.forceJsonResponse || (ct && ~ct.indexOf("json"))) {
		try {
			parsed = JSON.parse(response);
		} catch { //silent fail
		}
	}

	return parsed;
};

const processResponse = (sendRequest: SendRequest, options: SendOptions): Promise<UploadData> =>
    sendRequest
        .pXhr
        .then((xhr) => {
            let state, response, status;
            logger.debugLog("uploady.sender: received upload response ", xhr);

            state = ~SUCCESS_CODES.indexOf(xhr.status) ?
                FILE_STATES.FINISHED : FILE_STATES.ERROR;

            status = xhr.status;

            const resHeaders = parseResponseHeaders(xhr);

            response = {
                data: parseResponseJson(xhr.response, resHeaders, options),
                headers: resHeaders,
            };

            return {
                status,
                state,
                response,
            };
        })
        .catch((error) => {
            let state, response;

            if (sendRequest.aborted) {
                state = FILE_STATES.ABORTED;
                response = "aborted";
            } else {
                logger.debugLog("uploady.sender: upload failed: ", error);
                state = FILE_STATES.ERROR;
                response = error;
            }

            return { error: true, state, response, status: 0 };
        });

const abortRequest = (sendRequest: SendRequest) => {
	let abortCalled = false;
	const { aborted, getXhr } = sendRequest;

	const xhr = getXhr();

	if (!aborted && xhr && xhr.readyState && xhr.readyState !== 4) {
		logger.debugLog(`uploady.sender: cancelling request with ${sendRequest.count} items to: ${sendRequest.url}`);

		xhr.abort();
		sendRequest.aborted = true;
		abortCalled = true;
	}

	return abortCalled;
};

const getXhrSend = (config?: XhrSendConfig) =>
    (items: BatchItem[], url: ?string, options: SendOptions, onProgress?: OnProgress): SendResult => {
        if (!url) {
            throw new MissingUrlError(XHR_SENDER_TYPE);
        }

        logger.debugLog("uploady.sender: sending file: ", { items, url, options, });

        const sendRequest = makeRequest(items, url, options, onProgress, config);

        return {
            request: processResponse(sendRequest, options),
            abort: () => abortRequest(sendRequest),
            senderType: XHR_SENDER_TYPE,
        };
    };


export default getXhrSend;
