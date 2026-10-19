import type { ReactNode } from "react";

export interface StepItem {
  number: number;
  title: string;
  desc: string;
  icon: ReactNode;
}

export interface PrintItem {
  name: string;
  bgColor: string;
  icon: ReactNode;
}

export interface GalleryItem {
  id: number;
  name: string;
  category: string;
  bgColor: string;
  icon: ReactNode;
}
