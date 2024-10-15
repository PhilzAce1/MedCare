declare module "transformers" {
  const AutoTokenizer: any;
  const AutoModel: any;
  const BitsAndBytesConfig: any;
  export { AutoTokenizer, AutoModel, BitsAndBytesConfig };
}

declare module "torch" {
  const any: any;
  export = any;
}
