// @flow
import React, { useCallback, useState } from "react";
import { isFunction } from "@rpldy/shared";
import { useBatchStartListener } from "@rpldy/shared-ui";
import { getMandatoryOptions } from "./utils";
import { PREVIEW_TYPES } from "./consts";

import type { Element, ComponentType } from "react";
import type { Batch, BatchItem } from "@rpldy/shared";
import type {
	PreviewProps,
	MandatoryPreviewOptions,
	PreviewData,
	PreviewType,
} from "./types";

const getFallbackUrl = (fallbackProp, file: Object): ?PreviewData => {
	// let data = typeof fallbackProp === "function" ?
	let data = isFunction(fallbackProp) ?
		fallbackProp(file) :
		fallbackProp;

	if (typeof data === "string") {
		data = {
			url: data,
			type: PREVIEW_TYPES.IMAGE,
		};
	}

	return data;
};

const getFileObjectUrlByType = (type: PreviewType, mimeTypes, max, file: Object) => {
	let data;

	if (mimeTypes && ~mimeTypes.indexOf(file.type)) {
		if (!max || file.size <= max) {
			data = {
				url: URL.createObjectURL(file),
				type,
			};
		}
	}

	return data;
};

const getFilePreviewUrl = (file, options: MandatoryPreviewOptions): ?PreviewData => {
	let data;

	data = getFileObjectUrlByType(PREVIEW_TYPES.IMAGE, options.imageMimeTypes, options.maxPreviewImageSize, file);

	if (!data) {
		data = getFileObjectUrlByType(PREVIEW_TYPES.VIDEO, options.videoMimeTypes, options.maxPreviewVideoSize, file);
	}

	return data;
};

const loadPreviewUrl = (item: BatchItem, options: MandatoryPreviewOptions): ?PreviewData => {
	let data;

	if (item.file) {
		data = getFilePreviewUrl(item.file, options);

		if (!data) {
			data = getFallbackUrl(options.fallbackUrl, item.file);
		}
	} else
		data = {
			url: item.url,
			type: PREVIEW_TYPES.IMAGE,
		};

	return data;
};

const usePreviewsLoader = (props: PreviewProps): PreviewData[] => {
	const [previews, setPreviews] = useState<PreviewData[]>([]);
	const previewOptions = getMandatoryOptions(props);

	useBatchStartListener((batch: Batch) => {
		const items: BatchItem[] = previewOptions.loadFirstOnly ? batch.items.slice(0, 1) : batch.items;

		const previewsData = items
			.map((item) => loadPreviewUrl(item, previewOptions))
			.filter(Boolean);

		setPreviews(previewsData);
	});

	return previews;
};

/**
 * doesn't render its own container
 */
const Preview = (props: PreviewProps): Element<"img">[] | Element<ComponentType<any>>[] => {
	const [fallbackAttempted, setFallbackAttempted] = useState(false);
	const previews = usePreviewsLoader(props);

	const onImagePreviewLoadError = useCallback((e) => {
		if (!fallbackAttempted) {
			const img = e.target;

			const fallback = getFallbackUrl(props.fallbackUrl, img.src);

			if (fallback) {
				img.src = fallback.url;
			}

			setFallbackAttempted(true);
		}
	}, [fallbackAttempted, props.fallbackUrl]);

	return previews.map((data: PreviewData): Element<any> =>
		props.PreviewComponent ? <props.PreviewComponent {...props.previewProps} data={data}/> :
			<img key={data.url}
			     onError={onImagePreviewLoadError} src={data.url} {...props.previewProps} />);
};

export default Preview;