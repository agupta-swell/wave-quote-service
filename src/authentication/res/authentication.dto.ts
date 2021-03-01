export class AuthenticationDto {
  accessToken: string;

  type: string;

  constructor(props: any) {
    this.accessToken = props.accessToken;
    this.type = props.type || 'Bearer';
  }
}
