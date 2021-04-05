import { CssStyleSheet, LogicalPos, LogicalEdgeMap, LogicalEdgeDirection, DomCallbackContext, DynamicStyleContext, LogicalCssEvaluator, WritingMode } from "nehan";

export interface StyleArgs {
  selector?: string;
  direction: LogicalEdgeDirection;
  bgColor?: string;
  borderSize?: number;
  borderColor?: string;
  borderRadius?: number;
  triangleOffset?: number;
};

const defaultStyle = {
  selector: ".speech-border",
  direction: "start",
  bgColor: "white",
  borderColor: "#bcbcbc",
  borderSize: 2,
  borderRadius: 4,
  triangleOffset: 12,
};

const TriangleClipPath = {
  "top": "polygon(50% 0, 100% 100%, 0 100%)",
  "right": "polygon(0 0, 100% 50%, 0 100%)",
  "bottom": "polygon(0 0, 100% 0, 50% 100%)",
  "left": "polygon(0 50%, 100% 0, 100% 100%)",
};

function getTrianglePos(direction: LogicalEdgeDirection, triangleOffset: number) {
  switch (direction) {
    case "before": return {
      containerPos: { before: "0px", start: "0px" },
      outerPos: new LogicalPos({ start: triangleOffset, after: 0 }),
      innerPos: new LogicalPos({ start: triangleOffset + 2, after: 0 })
    };
    case "after": return {
      containerPos: { after: "0px", start: "0px" },
      outerPos: new LogicalPos({ start: triangleOffset, before: 0 }),
      innerPos: new LogicalPos({ start: triangleOffset + 2, before: 0 }),
    };
    case "start": return {
      containerPos: { before: "0px", start: "0px" },
      outerPos: new LogicalPos({ start: -16, before: triangleOffset }),
      innerPos: new LogicalPos({ start: -12, before: triangleOffset + 2 }),
    };
    case "end": return {
      containerPos: { before: "0px", end: "0px" },
      outerPos: new LogicalPos({ end: -16, before: triangleOffset }),
      innerPos: new LogicalPos({ end: -12, before: triangleOffset + 2 }),
    };
  }
};

function getClipPath(writingMode: WritingMode, direction: LogicalEdgeDirection) {
  const logicalMap = LogicalEdgeMap.select(writingMode);
  const clipDir = logicalMap.get(direction);
  return TriangleClipPath[clipDir];
}

/**
   @param {Object} args
   @param {Nehan.LogicalEdgeDirection} args.direction
   @param {String} args.bgColor
   @param {String} args.borderColor
   @return {Nehan.CssStyleSheet}
*/
export const create = (args: StyleArgs): CssStyleSheet => {
  const style = { ...defaultStyle, ...args };
  const trianglePos = getTrianglePos(style.direction, style.triangleOffset);

  return new CssStyleSheet({
    [`${style.selector}`]: {
      marginAfter: "1em",
    },
    [`${style.selector}.${style.direction}>.content`]: {
      [`margin-${style.direction}`]: "1em",
      "padding": "0.5em",
      "background": style.bgColor,
      "border": `${style.borderSize}px solid ${style.borderColor}`,
      "borderRadius": `${style.borderRadius}px`,
    },
    [`${style.selector}.${style.direction}>.content::before`]: {
      "display": "block",
      "position": "absolute",
      "content": " ",
      "measure": "0",
      "extent": "0",
      "!logical-pos": (ctx: DynamicStyleContext) => {
        return trianglePos.containerPos;
      },
      "@oncreate": (ctx: DomCallbackContext) => {
        const writingMode = ctx.box.env.writingMode;
        const evaluator = new LogicalCssEvaluator(writingMode);
        const clipPath = getClipPath(writingMode, style.direction);

        const $outer = document.createElement("div");
        $outer.style.position = "absolute";
        $outer.style.display = "block";
        $outer.style.content = " ";
        $outer.style.width = "16px";
        $outer.style.height = "16px";
        $outer.style.backgroundColor = style.borderColor;
        $outer.style.clipPath = clipPath;

        const $inner = document.createElement("div");
        $inner.style.position = "absolute";
        $inner.style.display = "block";
        $inner.style.content = " ";
        $inner.style.width = "12px";
        $inner.style.height = "12px";
        $inner.style.backgroundColor = style.bgColor;
        $inner.style.clipPath = clipPath;

        trianglePos.outerPos.acceptCssEvaluator(evaluator).applyTo($outer.style);
        trianglePos.innerPos.acceptCssEvaluator(evaluator).applyTo($inner.style);
        ctx.dom.appendChild($outer);
        ctx.dom.appendChild($inner);
      }
    }
  });
};
