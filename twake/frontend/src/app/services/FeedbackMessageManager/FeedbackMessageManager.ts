import { message } from 'antd';

class FeedbackMessage {
  success(content:string, duration:number, onClose?:any) {
    message.success(content, duration, onClose)
  }
  error(content:string, duration:number, onClose?:any) {
    message.error(content, duration, onClose)
  }
  info(content:string, duration:number, onClose?:any) {
    message.info(content, duration, onClose)
  }
  warning(content:string, duration:number, onClose?:any) {
    message.warning(content, duration, onClose)
  }
  loading(content:string, duration:number, onClose?:any) {
    message.loading(content, duration, onClose)
  }
}

const feedbackMessage = new FeedbackMessage();
export default feedbackMessage;

