import { redirect } from "next/navigation";

/** `/director/revitalization-roadmap` — UI lives under `home`. */
export default function DirectorRevitalizationRoadmapIndex() {
  redirect("/director/revitalization-roadmap/home");
}
