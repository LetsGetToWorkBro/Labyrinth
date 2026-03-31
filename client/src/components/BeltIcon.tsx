// Belt SVG icon component — maps belt name + stripes to the accurate belt graphic
// Anatomy: body → rank bar (with stripe tapes) → tail → knot loop
// Kids two-tone: horizontal stripe through body and tail, stops at rank bar

// Adult belts (0 stripes - default)
import adultWhite from "@assets/adult_white.svg";
import adultBlue from "@assets/adult_blue.svg";
import adultPurple from "@assets/adult_purple.svg";
import adultBrown from "@assets/adult_brown.svg";
import adultBlack from "@assets/adult_black.svg";
import adultRed from "@assets/adult_red.svg";
import adultRedBlack from "@assets/adult_red_black.svg";
import adultRedWhite from "@assets/adult_red_white.svg";

// Adult belts with stripes
import adultWhite1 from "@assets/adult_white_1s.svg";
import adultWhite2 from "@assets/adult_white_2s.svg";
import adultWhite3 from "@assets/adult_white_3s.svg";
import adultWhite4 from "@assets/adult_white_4s.svg";
import adultBlue1 from "@assets/adult_blue_1s.svg";
import adultBlue2 from "@assets/adult_blue_2s.svg";
import adultBlue3 from "@assets/adult_blue_3s.svg";
import adultBlue4 from "@assets/adult_blue_4s.svg";
import adultPurple1 from "@assets/adult_purple_1s.svg";
import adultPurple2 from "@assets/adult_purple_2s.svg";
import adultPurple3 from "@assets/adult_purple_3s.svg";
import adultPurple4 from "@assets/adult_purple_4s.svg";
import adultBrown1 from "@assets/adult_brown_1s.svg";
import adultBrown2 from "@assets/adult_brown_2s.svg";
import adultBrown3 from "@assets/adult_brown_3s.svg";
import adultBrown4 from "@assets/adult_brown_4s.svg";
import adultBlack1 from "@assets/adult_black_1s.svg";
import adultBlack2 from "@assets/adult_black_2s.svg";
import adultBlack3 from "@assets/adult_black_3s.svg";
import adultBlack4 from "@assets/adult_black_4s.svg";

// Kids solid belts
import kidsWhite from "@assets/kids_white.svg";
import kidsGrey from "@assets/kids_grey.svg";
import kidsYellow from "@assets/kids_yellow.svg";
import kidsOrange from "@assets/kids_orange.svg";
import kidsGreen from "@assets/kids_green.svg";

// Kids solid with stripes
import kidsWhite1 from "@assets/kids_white_1s.svg";
import kidsWhite2 from "@assets/kids_white_2s.svg";
import kidsWhite3 from "@assets/kids_white_3s.svg";
import kidsWhite4 from "@assets/kids_white_4s.svg";
import kidsGrey1 from "@assets/kids_grey_1s.svg";
import kidsGrey2 from "@assets/kids_grey_2s.svg";
import kidsGrey3 from "@assets/kids_grey_3s.svg";
import kidsGrey4 from "@assets/kids_grey_4s.svg";
import kidsYellow1 from "@assets/kids_yellow_1s.svg";
import kidsYellow2 from "@assets/kids_yellow_2s.svg";
import kidsYellow3 from "@assets/kids_yellow_3s.svg";
import kidsYellow4 from "@assets/kids_yellow_4s.svg";
import kidsOrange1 from "@assets/kids_orange_1s.svg";
import kidsOrange2 from "@assets/kids_orange_2s.svg";
import kidsOrange3 from "@assets/kids_orange_3s.svg";
import kidsOrange4 from "@assets/kids_orange_4s.svg";
import kidsGreen1 from "@assets/kids_green_1s.svg";
import kidsGreen2 from "@assets/kids_green_2s.svg";
import kidsGreen3 from "@assets/kids_green_3s.svg";
import kidsGreen4 from "@assets/kids_green_4s.svg";

// Kids two-tone belts (0 stripes)
import kidsGreyWhite from "@assets/kids_grey_white.svg";
import kidsGreyBlack from "@assets/kids_grey_black.svg";
import kidsYellowWhite from "@assets/kids_yellow_white.svg";
import kidsYellowBlack from "@assets/kids_yellow_black.svg";
import kidsOrangeWhite from "@assets/kids_orange_white.svg";
import kidsOrangeBlack from "@assets/kids_orange_black.svg";
import kidsGreenWhite from "@assets/kids_green_white.svg";
import kidsGreenBlack from "@assets/kids_green_black.svg";

// Kids two-tone with stripes
import kidsGreyWhite1 from "@assets/kids_grey_white_1s.svg";
import kidsGreyWhite2 from "@assets/kids_grey_white_2s.svg";
import kidsGreyWhite3 from "@assets/kids_grey_white_3s.svg";
import kidsGreyWhite4 from "@assets/kids_grey_white_4s.svg";
import kidsGreyBlack1 from "@assets/kids_grey_black_1s.svg";
import kidsGreyBlack2 from "@assets/kids_grey_black_2s.svg";
import kidsGreyBlack3 from "@assets/kids_grey_black_3s.svg";
import kidsGreyBlack4 from "@assets/kids_grey_black_4s.svg";
import kidsYellowWhite1 from "@assets/kids_yellow_white_1s.svg";
import kidsYellowWhite2 from "@assets/kids_yellow_white_2s.svg";
import kidsYellowWhite3 from "@assets/kids_yellow_white_3s.svg";
import kidsYellowWhite4 from "@assets/kids_yellow_white_4s.svg";
import kidsYellowBlack1 from "@assets/kids_yellow_black_1s.svg";
import kidsYellowBlack2 from "@assets/kids_yellow_black_2s.svg";
import kidsYellowBlack3 from "@assets/kids_yellow_black_3s.svg";
import kidsYellowBlack4 from "@assets/kids_yellow_black_4s.svg";
import kidsOrangeWhite1 from "@assets/kids_orange_white_1s.svg";
import kidsOrangeWhite2 from "@assets/kids_orange_white_2s.svg";
import kidsOrangeWhite3 from "@assets/kids_orange_white_3s.svg";
import kidsOrangeWhite4 from "@assets/kids_orange_white_4s.svg";
import kidsOrangeBlack1 from "@assets/kids_orange_black_1s.svg";
import kidsOrangeBlack2 from "@assets/kids_orange_black_2s.svg";
import kidsOrangeBlack3 from "@assets/kids_orange_black_3s.svg";
import kidsOrangeBlack4 from "@assets/kids_orange_black_4s.svg";
import kidsGreenWhite1 from "@assets/kids_green_white_1s.svg";
import kidsGreenWhite2 from "@assets/kids_green_white_2s.svg";
import kidsGreenWhite3 from "@assets/kids_green_white_3s.svg";
import kidsGreenWhite4 from "@assets/kids_green_white_4s.svg";
import kidsGreenBlack1 from "@assets/kids_green_black_1s.svg";
import kidsGreenBlack2 from "@assets/kids_green_black_2s.svg";
import kidsGreenBlack3 from "@assets/kids_green_black_3s.svg";
import kidsGreenBlack4 from "@assets/kids_green_black_4s.svg";

// Build lookup: belt key → [0s, 1s, 2s, 3s, 4s]
const BELT_VARIANTS: Record<string, string[]> = {
  // Adult
  white: [adultWhite, adultWhite1, adultWhite2, adultWhite3, adultWhite4],
  blue: [adultBlue, adultBlue1, adultBlue2, adultBlue3, adultBlue4],
  purple: [adultPurple, adultPurple1, adultPurple2, adultPurple3, adultPurple4],
  brown: [adultBrown, adultBrown1, adultBrown2, adultBrown3, adultBrown4],
  black: [adultBlack, adultBlack1, adultBlack2, adultBlack3, adultBlack4],
  red: [adultRed, adultRed, adultRed, adultRed, adultRed],
  "red/black": [adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack],
  "red-black": [adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack],
  coral: [adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack, adultRedBlack],
  "red/white": [adultRedWhite, adultRedWhite, adultRedWhite, adultRedWhite, adultRedWhite],
  "red-white": [adultRedWhite, adultRedWhite, adultRedWhite, adultRedWhite, adultRedWhite],
  // Kids solid
  "kids-white": [kidsWhite, kidsWhite1, kidsWhite2, kidsWhite3, kidsWhite4],
  grey: [kidsGrey, kidsGrey1, kidsGrey2, kidsGrey3, kidsGrey4],
  gray: [kidsGrey, kidsGrey1, kidsGrey2, kidsGrey3, kidsGrey4],
  yellow: [kidsYellow, kidsYellow1, kidsYellow2, kidsYellow3, kidsYellow4],
  orange: [kidsOrange, kidsOrange1, kidsOrange2, kidsOrange3, kidsOrange4],
  green: [kidsGreen, kidsGreen1, kidsGreen2, kidsGreen3, kidsGreen4],
  // Kids two-tone
  "grey/white": [kidsGreyWhite, kidsGreyWhite1, kidsGreyWhite2, kidsGreyWhite3, kidsGreyWhite4],
  "grey-white": [kidsGreyWhite, kidsGreyWhite1, kidsGreyWhite2, kidsGreyWhite3, kidsGreyWhite4],
  "grey/black": [kidsGreyBlack, kidsGreyBlack1, kidsGreyBlack2, kidsGreyBlack3, kidsGreyBlack4],
  "grey-black": [kidsGreyBlack, kidsGreyBlack1, kidsGreyBlack2, kidsGreyBlack3, kidsGreyBlack4],
  "yellow/white": [kidsYellowWhite, kidsYellowWhite1, kidsYellowWhite2, kidsYellowWhite3, kidsYellowWhite4],
  "yellow-white": [kidsYellowWhite, kidsYellowWhite1, kidsYellowWhite2, kidsYellowWhite3, kidsYellowWhite4],
  "yellow/black": [kidsYellowBlack, kidsYellowBlack1, kidsYellowBlack2, kidsYellowBlack3, kidsYellowBlack4],
  "yellow-black": [kidsYellowBlack, kidsYellowBlack1, kidsYellowBlack2, kidsYellowBlack3, kidsYellowBlack4],
  "orange/white": [kidsOrangeWhite, kidsOrangeWhite1, kidsOrangeWhite2, kidsOrangeWhite3, kidsOrangeWhite4],
  "orange-white": [kidsOrangeWhite, kidsOrangeWhite1, kidsOrangeWhite2, kidsOrangeWhite3, kidsOrangeWhite4],
  "orange/black": [kidsOrangeBlack, kidsOrangeBlack1, kidsOrangeBlack2, kidsOrangeBlack3, kidsOrangeBlack4],
  "orange-black": [kidsOrangeBlack, kidsOrangeBlack1, kidsOrangeBlack2, kidsOrangeBlack3, kidsOrangeBlack4],
  "green/white": [kidsGreenWhite, kidsGreenWhite1, kidsGreenWhite2, kidsGreenWhite3, kidsGreenWhite4],
  "green-white": [kidsGreenWhite, kidsGreenWhite1, kidsGreenWhite2, kidsGreenWhite3, kidsGreenWhite4],
  "green/black": [kidsGreenBlack, kidsGreenBlack1, kidsGreenBlack2, kidsGreenBlack3, kidsGreenBlack4],
  "green-black": [kidsGreenBlack, kidsGreenBlack1, kidsGreenBlack2, kidsGreenBlack3, kidsGreenBlack4],
};

interface BeltIconProps {
  belt: string;
  stripes?: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BeltIcon({ belt, stripes = 0, width = 60, height, className, style }: BeltIconProps) {
  const key = (belt || "white").toLowerCase().trim();
  const variants = BELT_VARIANTS[key] || BELT_VARIANTS.white;
  const stripeIdx = Math.max(0, Math.min(4, stripes));
  const src = variants[stripeIdx];
  const h = height || Math.round(width * 0.233);

  return (
    <img
      src={src}
      alt={`${belt} belt${stripes > 0 ? ` ${stripes} stripe${stripes > 1 ? "s" : ""}` : ""}`}
      width={width}
      height={h}
      className={className}
      style={{ display: "inline-block", ...style }}
      data-testid={`belt-icon-${key}`}
    />
  );
}

// All available belt keys for the belt selector
export const ADULT_BELT_OPTIONS = ["white", "blue", "purple", "brown", "black"];
export const KIDS_BELT_OPTIONS = [
  "kids-white",
  "grey/white", "grey", "grey/black",
  "yellow/white", "yellow", "yellow/black",
  "orange/white", "orange", "orange/black",
  "green/white", "green", "green/black",
];

export const BELT_DISPLAY_NAMES: Record<string, string> = {
  white: "White",
  blue: "Blue",
  purple: "Purple",
  brown: "Brown",
  black: "Black",
  "kids-white": "White",
  "grey/white": "Grey / White",
  grey: "Grey",
  "grey/black": "Grey / Black",
  "yellow/white": "Yellow / White",
  yellow: "Yellow",
  "yellow/black": "Yellow / Black",
  "orange/white": "Orange / White",
  orange: "Orange",
  "orange/black": "Orange / Black",
  "green/white": "Green / White",
  green: "Green",
  "green/black": "Green / Black",
};
