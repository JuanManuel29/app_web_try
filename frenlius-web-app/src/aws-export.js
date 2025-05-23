const awsConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: '101q5gvqu674oef9gvqv5hv911',
      userPoolId: 'us-east-2_khpKAsiNV',
      loginWith: {
          oauth: {
            domain: "frenlius-login.auth.us-east-2.amazoncognito.com",
            scopes: ["email", "openid"],
            redirectSignIn: ['http://localhost:5173/'],
            redirectSignOut: ['http://localhost:5173/'],
            responseType: "code",
            hostedUI: true,
            options: {
              AdvancedSecurityDataCollectionFlag: false,
              authFlowType: "USER_SRP_AUTH"
            },
        },
        username: 'true',
      }
    }
  }
};

export default awsConfig;