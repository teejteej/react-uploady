import { UPLOADER_EVENTS } from "../consts";

const mockSender = jest.fn();

jest.doMock("@rpldy/sender", () => mockSender);

import createProcessor, { initUploadQueue } from "../processor";
import { FILE_STATES } from "@rpldy/shared";

describe("processor tests", () => {

	const mockTrigger = jest.fn(),
		mockCancellable = jest.fn();

	beforeEach(() => {
		clearJestMocks(mockTrigger,
			mockCancellable);
	});

	describe("upload queue tests", () => {

		const getQueueTest = (state = {}, options = {}) => {

			state = {
				currentBatch: null,
				batches: {},
				items: {},
				activeIds: [],
				...state
			};

			options = {
				...options,
			};

			const queue = initUploadQueue(state, options, mockCancellable, mockTrigger);

			return {
				queue,
				state,
			};
		};

		it("should send file to upload successfully", () => {

		});

		it("should put file into pending queue in case no concurrent", () => {

		});

		it("should send files to upload if concurrent enabled ", () => {

		});

		describe("onRequestFinished tests", () => {

			it("should finalize if last file in batch", () => {

			});

			it("should continue to next item in batch after previous finished", async () => {
				const batch = { id: "b1" };
				const { queue, state } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b1" },
					},
					batches: {
						b1: { batch },
					}
				});

				queue.getItemQueue().push("u1", "u2");

				mockCancellable.mockResolvedValueOnce(true);

				await queue.onRequestFinished("u1", {
					state: FILE_STATES.FINISHED,
					response: { success: true }
				});

				expect(mockCancellable).toHaveBeenCalledTimes(1);
				expect(mockCancellable).toHaveBeenCalledWith(UPLOADER_EVENTS.FILE_START, state.items.u2);
				expect(mockTrigger).toHaveBeenCalledWith(UPLOADER_EVENTS.BATCH_FINISH, batch);
				expect(mockTrigger).toHaveBeenCalledWith(UPLOADER_EVENTS.FILE_FINISH, state.items.u1);
				expect(mockTrigger).toHaveBeenCalledWith(UPLOADER_EVENTS.FILE_CANCEL, state.items.u2);
			});

			it("shouldn't process next if already being uploaded", () => {

			});


		});

		describe("getNextIdGroup tests", () => {

			it("should return the next id without grouping", () => {
				const batch = { id: "b1" };

				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b1" },
						"u3": { batchId: "b1" },
						"u4": { batchId: "b1" },
					},
					batches: {
						b1: {
							batch,
							addOptions: {}
						},
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4");

				const ids = queue.getNextIdGroup();

				expect(ids).toEqual(["u2"]);
			});

			it("should return next id from different batch", () => {
				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b2" },
						"u3": { batchId: "b2" },
						"u4": { batchId: "b2" },
					},
					batches: {
						b1: {
							batch: { id: "b1" },
							addOptions: {}
						},
						b2: {
							batch: { id: "b2" },
							addOptions: {}
						}
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4");

				const ids = queue.getNextIdGroup();

				expect(ids).toEqual(["u2"]);
			});

			it("should group files into single upload", () => {
				const batch = { id: "b1" };

				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b1" },
						"u3": { batchId: "b1" },
						"u4": { batchId: "b1" },
					},
					batches: {
						b1: {
							batch,
							addOptions: {
								grouped: true,
								maxGroupSize: 2,
							}
						},
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4");

				const ids = queue.getNextIdGroup();

				expect(ids).toEqual(["u2", "u3"]);
			});

			it("should group files only from same batch", () => {
				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b1" },
						"u3": { batchId: "b1" },
						"u4": { batchId: "b1" },
						"u5": { batchId: "b2" },
					},
					batches: {
						b1: {
							batch: { id: "b1" },
							addOptions: {
								grouped: true,
								maxGroupSize: 4,
							}
						},
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4", "u5");

				const ids = queue.getNextIdGroup();

				expect(ids).toEqual(["u2", "u3", "u4"]);
			});

			it("should group files starting from new batch", () => {
				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b2" },
						"u3": { batchId: "b2" },
						"u4": { batchId: "b2" },
						"u5": { batchId: "b3" },
					},
					batches: {
						b1: {
							batch: { id: "b1" },
						},
						b2: {
							batch: {id: "b2"},
							addOptions: {
								grouped: true,
								maxGroupSize: 4,
							}
						}
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4", "u5");

				const ids = queue.getNextIdGroup();

				expect(ids).toEqual(["u2", "u3", "u4"]);

			});

			it("should return nothing in case all items already active", () => {

				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
						"u2": { batchId: "b1" },
						"u3": { batchId: "b1" },
						"u4": { batchId: "b1" },
						"u5": { batchId: "b2" },
					},
					batches: {
						b1: {
							batch: { id: "b1" },
							addOptions: {
								grouped: true,
								maxGroupSize: 4,
							}
						},
					},
					activeIds: ["u1", ["u2", "u3"], "u4", "u5"],
				});

				queue.getItemQueue().push("u1", "u2", "u3", "u4", "u5");

				const ids = queue.getNextIdGroup();

				expect(ids).toBeUndefined();
			});

			it("should return nothing in case nothing in queue", () => {
				const { queue } = getQueueTest({
					currentBatch: "b1",
					items: {
						"u1": { batchId: "b1" },
					},
					batches: {
						b1: {
							batch: { id: "b1" },
							addOptions: {
								grouped: true,
								maxGroupSize: 4,
							}
						},
					},
					activeIds: ["u1"],
				});

				queue.getItemQueue().push("u1");

				const ids = queue.getNextIdGroup();

				expect(ids).toBeUndefined();

			});
		});

		describe("processNext tests", () => {





		});

		describe("batch finished tests", () => {

			it("should finalize batch if no more uploads in queue", () => {

				const batch = {};

				const { queue, state } = getQueueTest({
					currentBatch: "b1",
					batches: {
						b1: { batch },
					}
				});

				queue.cleanUpFinishedBatch();

				expect(state.batches.b1).toBeUndefined();
				expect(mockTrigger).toHaveBeenCalledWith(UPLOADER_EVENTS.BATCH_FINISH, batch);
			});

			it("should finalize batch if next upload is from different batch", () => {

				const batch = {};

				const { queue, state } = getQueueTest({
					currentBatch: "b1",
					batches: {
						b1: { batch },
						b2: {
							batch: { id: "b2" },
						}
					},
					items: {
						"u2": { batchId: "b2" }
					}
				});

				queue.getItemQueue().push("u1", "u2");

				queue.cleanUpFinishedBatch();

				expect(state.batches.b1).toBeUndefined();
				expect(mockTrigger).toHaveBeenCalledWith(UPLOADER_EVENTS.BATCH_FINISH, batch);
			});

			it("shouldn't finalize batch if it has more uploads", () => {
				const batch = { id: "b1" };

				const { queue, state } = getQueueTest({
					currentBatch: "b1",
					batches: {
						b1: { batch },
						b2: {
							batch: { id: "b2" },
						}
					},
					items: {
						"u2": { batchId: "b1" },
						"u3": { batchId: "b2" },
					}
				});

				queue.getItemQueue().push("u1", "u2", "u3");

				queue.cleanUpFinishedBatch();

				expect(state.batches.b1).toBeDefined();
				expect(mockTrigger).not.toHaveBeenCalledWith(UPLOADER_EVENTS.BATCH_FINISH, batch);
			});

		});

	});


});