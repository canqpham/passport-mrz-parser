import axios from 'axios'

// const API_URL = 'https://package2.jp.ariadirect.com/' // api to test
const API_URL = 'http://localhost:5000'

export default (url) => axios.create({
  baseURL: API_URL,
  timeout: 500000,
//   headers: {
//     ...headers,
//   },
})