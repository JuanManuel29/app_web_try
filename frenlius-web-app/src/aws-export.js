const awsConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: '101q5gvqu674oef9gvqv5hv911',
      userPoolId: 'us-east-2_khpKAsiNV',
      loginWith: {
        email: false,
        username: true,
        phone: false,
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export default awsConfig;