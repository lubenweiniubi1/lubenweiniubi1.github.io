import { Middleware } from "@reduxjs/toolkit"

export const loggerMiddleware: Middleware = store => next => action => {
  console.log("Dispatching:", action)
  console.log("Previous State:", store.getState())
  const result = next(action) // 调用下一个中间件或 Reducer
  console.log("Next state:", store.getState())

  return result
}
