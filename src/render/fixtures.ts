import { PRESETS } from "../index"
import { type ViewMode, type View, type Camera, naturalSize, makeCamera, fitView } from "./camera"

export function testCamera(mode: ViewMode, view?: View): Camera {
    const size = naturalSize(mode, PRESETS.bigmap)
    return makeCamera(mode, view ?? fitView(mode, PRESETS.bigmap, size.width, size.height))
}