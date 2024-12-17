import express from 'express'
import MessageController from '../controllers/messageController'

const router = express.Router()


const messageController = new MessageController() 

router.get('/call-history/:trainerId/', messageController.getCallHistory)
router.get('/call-history-user/:userId/', messageController.getCallHistoryUser)
router.get('/:token/:id', messageController.getMessage)
router.post('/send',  messageController.sendMessage)

export default router