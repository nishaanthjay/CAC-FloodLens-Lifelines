import { Ambulance, Building2, Flame, HeartPulse, Hospital, BedDouble, Pill, Siren, Stethoscope, type LucideIcon } from "lucide-react";
import type { Kind } from "@/lib/services";

const ICON: Record<Kind, LucideIcon> = {
  hospital_ed: Hospital, hospital: Building2, urgent_care: Stethoscope, dialysis: HeartPulse, nursing_home: BedDouble,
  fire: Flame, ems: Ambulance, police: Siren, pharmacy: Pill,
};

export function KindIcon({ kind, size = 16 }: { kind: Kind; size?: number }) {
  const I = ICON[kind];
  return <I size={size} aria-hidden />;
}
