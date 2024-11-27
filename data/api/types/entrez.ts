/**
 * example:
 * https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=Commun%20Biol%5BTA%5D
 */
export type EsearchResults = {
  header: {
    type: string;
    version: string;
  };
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
    translationset: { from: string; to: string }[];
    querytranslation: string;
  };
};

/**
 * example:
 * https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=39580597
 */
export type EsummaryResults = {
  header?: Header;
  result?: Results;
};

export type Header = {
  type?: string;
  version?: string;
};

export type Results = Record<string, Result>;

export type Result = {
  uid?: string;
  pubdate?: string;
  epubdate?: string;
  source?: string;
  authors?: Author[];
  lastauthor?: string;
  title?: string;
  sorttitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  lang?: string[];
  nlmuniqueid?: string;
  issn?: string;
  essn?: string;
  pubtype?: string[];
  recordstatus?: string;
  pubstatus?: string;
  articleids?: Articleid[];
  history?: History[];
  references?: unknown[];
  attributes?: string[];
  pmcrefcount?: number;
  fulljournalname?: string;
  elocationid?: string;
  doctype?: string;
  srccontriblist?: unknown[];
  booktitle?: string;
  medium?: string;
  edition?: string;
  publisherlocation?: string;
  publishername?: string;
  srcdate?: string;
  reportnumber?: string;
  availablefromurl?: string;
  locationlabel?: string;
  doccontriblist?: unknown[];
  docdate?: string;
  bookname?: string;
  chapter?: string;
  sortpubdate?: string;
  sortfirstauthor?: string;
  vernaculartitle?: string;
};

export type Articleid = {
  idtype?: string;
  idtypen?: number;
  value?: string;
};

export type Author = {
  name?: string;
  authtype?: string;
  clusterid?: string;
};

export type History = {
  pubstatus?: string;
  date?: string;
};
