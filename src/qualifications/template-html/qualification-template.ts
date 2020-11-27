const header = (title: string) => `<div style="width: 100%; background: #005f9f">
      <img src="https://s3-us-west-2.amazonaws.com/swell-docs/logos/logo-text-white.png" style="width: 150px; margin-top: 0px; margin-bottom: 0px; margin-right: auto; margin-left: auto; display: block; padding-top: 40px" />
      <img src="https://s3.amazonaws.com/switchboard-docs/images/New_task.png" style="width: 150px; display: block; margin-top: 0px; margin-bottom: 0px; margin-right: auto; margin-left: auto; padding-top: 30px; padding-right: 32px" />
      <h1 style="font-weight: 600; text-transform: uppercase; font-size: 18px; color: #ffffff; letter-spacing: 5px; text-align: center; padding-top: 15px; padding-bottom: 30px" >${title}</h1>
    </div>`;

const footer = () => `<div style="font-size: 14px; color: #58595B; margin-top: 21px">
      <p style="margin-bottom: 0">
        Swell Energy Team 
      </p>
      <p style="margin-top: 2px">
        (800) 360-9037

        <br />
        support@swellenergy.com

        <br />
        teamswitchboard.slack.com

      </p>
    </div>`;

export default `
  <html>
    <head>
      <title>Swell Energy: Your Qualification</title>
      <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700" rel="stylesheet" type="text/css" />
    </head>
    <body style="font-family: Source Sans Pro; sans-serif">
      <div style="width: 598px">
        ${header('Qualification')}
        <div style="padding-top: 25px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px; border-bottom: 1px solid #e5e6e7; position: relative" >
          <p style="font-size: 14px; margin-bottom: 30px; font-weight: 700">
            Dear {{customerName}},
          </p>
          <p style="font-size: 14px; margin-bottom: 20px; line-height: 26px">
            {{qualificationIntro}}
            Thanks for your interest in Swell's Service.
          <br>Per your request, we are pleased to share a link to a qualification custom made for you.
          <br>This qualification will be accessible for next {{qualificationValidityPeriod}} days.
          <br>{{recipientNotice}}
          <br>You can access your qualification through the link provided below.
          </p>
          <a href="{{qualificationLink}}" style="color:#ffffff!important;display:inline-block;font-weight:500;font-size:16px;line-height:42px;width:auto;white-space:nowrap;min-height:42px;margin:12px 5px 12px 0;padding:0 22px;text-decoration:none;text-align:center;border:0;border-radius:3px;vertical-align:top;background-color:#00aeef!important" target="_blank">
            <span style="display:inline;text-decoration:none;font-weight:500;font-style:normal;font-size:16px;line-height:42px;border:none;background-color:#00aeef!important;color:#ffffff!important">
              Click Here
            </span>
          </a>
          <div style="font-size: 14px; padding-bottom: 8px; margin-top: 40px">
            <p style="font-weight: 700" >
              Regards,
            </p>
            <img src="https://s3-us-west-2.amazonaws.com/swell-docs/logos/logo-icon-fade.png" style="width: 200px; float: right; margin-top: 17px" />
            <img src="https://s3-us-west-2.amazonaws.com/swell-docs/logos/logo-text-color.png" alt="" style="width: 260px; margin-bottom: 15px; display: block" />
          </div>
        </div>
        ${footer()}
      </div>
    </body>
  </html>
`;
