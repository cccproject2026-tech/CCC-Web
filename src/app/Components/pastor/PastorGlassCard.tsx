"use client";

import type { ReactNode } from "react";

import { pastorGlassCard } from "./pastor-theme";

export type PastorGlassCardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
};

/** Standard gradient card shell for roadmap/assessment-style lists on navy backgrounds. */
export default function PastorGlassCard({ children, className = "", as: Tag = "div" }: PastorGlassCardProps) {
  return <Tag className={`${pastorGlassCard} ${className}`.trim()}>{children}</Tag>;
}
