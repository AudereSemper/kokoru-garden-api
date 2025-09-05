// src/modules/auth/auth.schemas.ts
import { FastifySchema } from 'fastify';

export const authSchemas = {
  register: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 255,
        },
        firstName: {
          type: 'string',
          maxLength: 50,
        },
        lastName: {
          type: 'string',
          maxLength: 50,
        },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  isEmailVerified: { type: 'boolean' },
                  hasCompletedOnboarding: { type: 'boolean' },
                  onboardingStep: { type: 'number' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresIn: { type: 'number' },
                },
              },
              requiresOnboarding: { type: 'boolean' },
              onboardingStep: { type: 'number' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  login: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
        },
        password: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  isEmailVerified: { type: 'boolean' },
                  hasCompletedOnboarding: { type: 'boolean' },
                  onboardingStep: { type: 'number' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresIn: { type: 'number' },
                },
              },
              requiresOnboarding: { type: 'boolean' },
              onboardingStep: { type: 'number' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  verifyEmail: {
    params: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  forgotPassword: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  resetPassword: {
    params: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    body: {
      type: 'object',
      required: ['password'],
      properties: {
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 255,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  refreshToken: {
    body: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresIn: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  } as FastifySchema,

  googleAuth: {
    body: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  isEmailVerified: { type: 'boolean' },
                  hasCompletedOnboarding: { type: 'boolean' },
                  onboardingStep: { type: 'number' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresIn: { type: 'number' },
                },
              },
              requiresOnboarding: { type: 'boolean' },
              onboardingStep: { type: 'number' },
              isNewUser: { type: 'boolean' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  logout: {
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  getMe: {
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  isEmailVerified: { type: 'boolean' },
                  hasCompletedOnboarding: { type: 'boolean' },
                  onboardingStep: { type: 'number' },
                },
              },
              requiresOnboarding: { type: 'boolean' },
              onboardingStep: { type: 'number' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  resendVerification: {
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageCode: { type: 'string' },
        },
      },
    },
  } as FastifySchema,
};
