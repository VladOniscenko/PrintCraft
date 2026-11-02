import catToyUrl from "../assets/hero-models/cat_toy.stl?url";
import cableHolderUrl from "../assets/hero-models/cable-holder.stl?url";
import dinoUrl from "../assets/hero-models/dino.stl?url";

export interface SampleModel {
  id: string;
  name: string;
  fileName: string;
  url: string;
  defaultMaterial: string;
  defaultColor: string;
}

export const SAMPLE_MODELS: SampleModel[] = [
  {
    id: "fluted-planter",
    name: "Fluted Planter",
    fileName: "fluted_vase_demo.stl",
    url: catToyUrl,
    defaultMaterial: "PLA",
    defaultColor: "Dark Teal",
  },
  {
    id: "cable-organizer",
    name: "Cable Organizer",
    fileName: "cable_clip_demo.stl",
    url: cableHolderUrl,
    defaultMaterial: "PETG",
    defaultColor: "Black",
  },
  {
    id: "lowpoly-dino",
    name: "Low-Poly Dino",
    fileName: "dino_demo.stl",
    url: dinoUrl,
    defaultMaterial: "PLA",
    defaultColor: "Emerald Green",
  },
];

export function getDefaultSampleModel(): SampleModel {
  return SAMPLE_MODELS[0];
}

