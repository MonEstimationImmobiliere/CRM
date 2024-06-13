type HeadingSizes = "1" | "2" | "3" | "4" | "5" | "6";
export type Heading = `h${HeadingSizes}`;

type ParagraphSizes = "1" | "2";
export type Paragraph = `p${ParagraphSizes}`;

export type Typography = Heading | Paragraph;
