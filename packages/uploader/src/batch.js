// @flow
import { BATCH_STATES, FILE_STATES } from "@rpldy/shared";
import { isString, isObjectLike, } from "lodash";
import type {
	UploadInfo,
	BatchItem,
	Batch,
} from "@rpldy/shared";

let bCounter = 0,
	fCounter = 0;

const getBatchItemWithUrl = (batchItem: Object, url: string): BatchItem => {
	batchItem.url = url;
	return batchItem;
};

const getBatchItemWithFile = (batchItem: Object, file: Object): BatchItem => {
	batchItem.file = file;
	return batchItem;
};

const createBatchItem = (f: UploadInfo, batchId: string): BatchItem => {
	fCounter += 1;
	const id = `${batchId}.file-${fCounter}`,
		state = FILE_STATES.ADDED;

	let batchItem = {
		id,
		batchId,
		state,
		completed: 0,
		loaded: 0,
		aborted: false,
	};

	if (isString(f)) {
		batchItem = getBatchItemWithUrl(batchItem, f);
	} else if (isObjectLike(f)) {
		batchItem = getBatchItemWithFile(batchItem, f);
	} else {
		throw new Error(`Unknown type of file added: ${typeof (f)}`);
	}

	return batchItem;
};

const processFiles = (batchId, files: UploadInfo): BatchItem[] =>
	Array.prototype.map.call(files, (f) => createBatchItem(f, batchId));

export default (files: UploadInfo | UploadInfo[], uploaderId: string): Batch => {
	bCounter += 1;
	const id = `batch-${bCounter}`;

	files = (Array.isArray(files) || files instanceof FileList) ? files : [files];

	return {
		id,
		uploaderId,
		items: processFiles(id, files),
		state: BATCH_STATES.ADDED,
	};
};