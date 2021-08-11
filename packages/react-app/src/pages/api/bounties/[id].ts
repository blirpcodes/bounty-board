import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../utils/dbConnect'
import Bounty from '../../../models/Bounty'
import DiscordUtils from '../../../utils/DiscordUtils'

const BOUNTY_BOARD_WEBHOOK_URI = process.env.DISCORD_BOUNTY_BOARD_WEBHOOK || ''

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        const bounty = await Bounty.findById(id)
        if (!bounty) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: bounty })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'PUT' /* Edit a model by its ID */:
      try {
        const bounty = await Bounty.findById(id).exec()
        if (bounty.status.toLowerCase() === 'draft') {
          Bounty.findByIdAndUpdate(id, req.body, {
            new: true,
            omitUndefined: true,
            runValidators: true,
          })
            .then(async (updateBounty) => {
              await publishBountyToDiscordChannel(updateBounty)
              res.status(200).json({ success: true, data: updateBounty })
            })
            .catch(() => {
              return res.status(400).json({ success: false })
            })
        } else {
          return res.status(400).json({ success: false })
        }
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    default:
      res.status(400).json({ success: false })
      break
  }
}

export const publishBountyToDiscordChannel = (bounty: any): Promise<any> => {
  const embedMessage = DiscordUtils.generateBountyEmbedsMessage(bounty)
  return fetch(BOUNTY_BOARD_WEBHOOK_URI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(embedMessage),
  }).catch(console.error)
}