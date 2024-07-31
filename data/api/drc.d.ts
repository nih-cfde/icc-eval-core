/** (data coordination centers) */
export type DCC = {
  link?: string;
  lastmodified?: string;
  current?: string;
  creator?: string;
  dcc_id?: string;
  drcapproved?: string;
  dccapproved?: string;
  deleted?: string;
  created?: string;
};

export type Files = {
  filetype?: string;
  filename?: string;
  link?: string;
  size?: string;
  sha256checksum?: string;
};

export type Code = {
  type?: string;
  name?: string;
  link?: string;
  description?: string;
  openAPISpec?: string;
  smartAPISpec?: string;
  smartAPIURL?: string;
  entityPageExample?: string;
};
