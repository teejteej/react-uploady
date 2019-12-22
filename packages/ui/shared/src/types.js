// @flow
import type { UploaderType } from "@rpldy/uploader";
import type { UploadInfo, UploadOptions } from "@rpldy/shared";
import type { OnAndOnceMethod, OffMethod } from "@rpldy/life-events";

export type AddUploadFunction = (files: UploadInfo | UploadInfo[], addOptions: UploadOptions) => void;

export type UploadyContextType = {
	uploader: UploaderType,
	getInputField: () => ?HTMLInputElement,
	showFileUpload: () => void,
	upload: AddUploadFunction,
	on: OnAndOnceMethod,
	once: OnAndOnceMethod,
	off: OffMethod,
};