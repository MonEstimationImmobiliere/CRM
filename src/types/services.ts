import { AxiosResponse } from "axios";

export type ServiceRequest<T extends { params?: unknown; pathParams?: unknown; body?: unknown }> = {
  [P in keyof T]: T[P];
};

export type ServiceResponse<Content = unknown> = Promise<AxiosResponse<IApiResponse<Content>>>;

export interface IApiResponse<Content = unknown> {
  message: string | null;
  result: Content;
  resultCount?: number;
  resultAmount?: number;
  items: Content;
  status?: EServiceResponseStatus;
  userMessage: string | null;
}

export enum EServiceResponseStatus {
  Ok = "Ok",
  InvalidArgument = "InvalidArgument",
  InternalServerError = "InternalServerError",
  RequestSizeExeeded = "RequestSizeExeeded",
  InvalidChecksum = "InvalidChecksum",
  SignupNotComplete = "SignupNotComplete",
  NotAuthorized = "NotAuthorized",
  ConfigOutOfDate = "ConfigOutOfDate",
  AccountingPlanIncomplete = "AccountingPlanIncomplete",
  InvalidForSubscription = "InvalidForSubscription",
  InvalidImpersonificationToken = "InvalidImpersonificationToken",
  CallbackRequestFailed = "CallbackRequestFailed",
  PaymentFailed = "PaymentFailed",
  NotEnoughTokensAvailable = "NotEnoughTokensAvailable",
  InvalidCoupon = "InvalidCoupon",
  AlreadyInProgress = "AlreadyInProgress",
  Timeout = "Timeout",
  AlreadyExist = "AlreadyExist",
  LoginMethodRestriction = "LoginMethodRestriction",
  LogoutRequired = "LogoutRequired",
  IncorrectOrganizationId = "IncorrectOrganizationId"
}