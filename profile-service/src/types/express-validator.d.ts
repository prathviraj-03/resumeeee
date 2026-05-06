declare module "express-validator" {
  export function body(field: string): any;
  export function validationResult(req: any): any;
}
