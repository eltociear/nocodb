import { message } from 'ant-design-vue'
import { Api } from 'nocodb-sdk'
import type { Actions, State } from './types'

export function useGlobalActions(state: State): Actions {
  /** detached api instance, will not trigger global loading */
  const api = new Api()

  /** Sign out by deleting the token from localStorage */
  const signOut: Actions['signOut'] = () => {
    state.token.value = null
    state.user.value = null
  }

  /** Sign in by setting the token in localStorage */
  const signIn: Actions['signIn'] = async (newToken) => {
    state.token.value = newToken

    if (state.jwtPayload.value) {
      state.user.value = {
        id: state.jwtPayload.value.id,
        email: state.jwtPayload.value.email,
        firstname: state.jwtPayload.value.firstname,
        lastname: state.jwtPayload.value.lastname,
        roles: state.jwtPayload.value.roles,
      }
    }
  }

  /** manually try to refresh token */
  const refreshToken = async () => {
    api.instance
      .post('/auth/refresh-token', null, {
        withCredentials: true,
      })
      .then((response) => {
        if (response.data?.token) {
          signIn(response.data.token)
        }
      })
      .catch((err) => {
        message.error(err.message || 'You have been signed out.')
        signOut()
      })
  }

  return { signIn, signOut, refreshToken }
}
