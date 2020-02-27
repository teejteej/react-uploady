// @flow
import React, { Component, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import Uploady from "@rpldy/uploady";
import UploadDropZone from "./src";
import {
    withKnobs,
    useStoryUploadySetup,
    StoryUploadProgress,
} from "../../../story-helpers";
import UploadButton from "@rpldy/upload-button";

// import readme from '../README.md';

const StyledDropZone = styled(UploadDropZone)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 400px;
    height: 400px;
    border: 1px dotted #000;

    #drop-text {
      display: none;
    }

    &.drag-over {
      background-color: rgba(114,255,59,0.6);
        #drop-text {
          display: block;
        }

        #drag-text {
          display: none;
        }
    }
`;

const SmallDropZone = styled(StyledDropZone)`
  width: 200px;
  height: 200px;
`;

export const Simple = () => {
    const { enhancer, destination, multiple, grouped, groupSize } = useStoryUploadySetup();

    return <Uploady debug
                    multiple={multiple}
                    destination={destination}
                    enhancer={enhancer}
                    grouped={grouped}
                    maxGroupSize={groupSize}>

        <StyledDropZone onDragOverClassName="drag-over">
            <div id="drag-text">Drag File(s) Here</div>
            <div id="drop-text">Drop Files(s) Here</div>
        </StyledDropZone>
    </Uploady>;
};

export const WithProgress = () => {
    const { enhancer, destination, multiple, grouped, groupSize } = useStoryUploadySetup();

    return <Uploady debug
                    multiple={multiple}
                    destination={destination}
                    enhancer={enhancer}
                    grouped={grouped}
                    maxGroupSize={groupSize}>

        <StyledDropZone onDragOverClassName="drag-over">
            <div id="drag-text">Drag File(s) Here</div>
            <div id="drop-text">Drop Files(s) Here</div>

            <StoryUploadProgress/>
        </StyledDropZone>
    </Uploady>;
};

export const WithDropHandler = () => {
    const { enhancer, destination, multiple, grouped, groupSize } = useStoryUploadySetup();

    const dropHandler = useCallback((e) => {
        console.log(">>>> DROP EVENT " , e.dataTransfer);
        return "https://i.pinimg.com/originals/51/bf/9c/51bf9c7fdf0d4303140c4949afd1d7b8.jpg";
    },[]);

    return <Uploady debug
                    multiple={multiple}
                    destination={destination}
                    enhancer={enhancer}
                    grouped={grouped}
                    maxGroupSize={groupSize}>

        <StyledDropZone onDragOverClassName="drag-over" dropHandler={dropHandler}>
            <div id="drag-text">Drag File(s) Here</div>
            <div id="drop-text">Drop Files(s) Here</div>
        </StyledDropZone>
    </Uploady>;
};

const DifferentWrapper = styled.div`
  display: flex;
  justify-content: space-around;
`;

export const DifferentConfiguration = () => {
    const { enhancer, destination, multiple, grouped, groupSize } = useStoryUploadySetup();

    const destinationOverride = useMemo(() => ({
        ...destination,
        headers: { ...destination.headers, "x-test": "1234" }
    }), [destination]);

    return <Uploady debug
                    multiple={multiple}
                    destination={destination}
                    enhancer={enhancer}
                    grouped={grouped}
                    maxGroupSize={groupSize}>

        <p>
            DropZones can use different configuration overrides.
            However, Some options cannot be overriden.<br/>
            For example, any prop that influence the file input directly (such as multiple)
        </p>

        <DifferentWrapper>
            <SmallDropZone onDragOverClassName="drag-over" autoUpload={false}>
                <h2>autoUpload = false</h2>
                <div id="drag-text">Drag File(s) Here</div>
                <div id="drop-text">Drop Files(s) Here</div>
            </SmallDropZone>

            <SmallDropZone onDragOverClassName="drag-over" destination={destinationOverride}>
                <h2>add 'x-test' header</h2>
                <div id="drag-text">Drag File(s) Here</div>
                <div id="drop-text">Drop Files(s) Here</div>
            </SmallDropZone>
        </DifferentWrapper>

        <StoryUploadProgress/>
    </Uploady>;
};

export const With3rdPartyDropZone = () => {

};

export default {
    component: UploadDropZone,
    title: "Upload Drop Zone",
    decorators: [withKnobs],
};
