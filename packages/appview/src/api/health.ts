import { Router } from 'express'

import { AppContext } from '#/context'

export const createRouter = (ctx: AppContext) => {
  const router = Router()

  router.get('/health', async function (req, res) {
    res.status(200).send('OK')
  })

  return router
}
