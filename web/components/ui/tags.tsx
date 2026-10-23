/** Provenance tag shown beside every value: real model output (replay by default; pass label="forecast" in the live view) or placeholder. */
export const Tag = ({ synthetic, label = "replay" }: { synthetic: boolean; label?: string }) =>
  synthetic ? (
    <span className="ml-1.5 whitespace-nowrap rounded-full bg-[#EFE3FF] px-1.5 py-px font-ui text-[10px] font-semibold text-[#5A2D91]">placeholder</span>
  ) : (
    <span className="ml-1.5 whitespace-nowrap rounded-full bg-soft-blue px-1.5 py-px font-ui text-[10px] font-semibold text-blue">{label}</span>
  );
