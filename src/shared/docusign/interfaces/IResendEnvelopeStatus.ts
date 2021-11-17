export interface IResendEnvelopeSuccess {
  status: true;
}

export interface IResendEnvelopeFail {
  status: false;
  message: string;
}

export type TResendEnvelopeStatus = IResendEnvelopeFail | IResendEnvelopeSuccess;
