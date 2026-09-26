import { readFileSync } from "fs";
import { NetBrain } from "../evo/NetBrain";
import type { Entrant } from "../types";
import { CamperV1 } from "./CamperV1";
import { CamperV2 } from "./CamperV2";
import { ChaserV1 } from "./ChaserV1";
import { ChaserV2 } from "./ChaserV2";
import { CowardV1 } from "./CowardV1";
import { RandomBot } from "./RandomBot";

export const BOTS = { RandomBot, ChaserV1, CowardV1, ChaserV2, CamperV1, CamperV2, NetBrain }

export const entrants: Entrant[] =
    [
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV1', make: rng => new BOTS.ChaserV1(rng) },
        { name: 'chaserV1', make: rng => new BOTS.ChaserV1(rng) },
        { name: 'chaserV1', make: rng => new BOTS.ChaserV1(rng) },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) },
        { name: 'evolved', make: () => new NetBrain(JSON.parse(readFileSync('best.json', 'utf8'))) }]
