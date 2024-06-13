import axios from 'axios';
import { AxiosInstance } from 'axios';
// import env from './env';

// const baseURL = import.meta.env.VUE_APP_API_URL;
const baseURL = 'https://mytms.fr/public/api';

export const getAPI = (): AxiosInstance => {
    // const headers: { [key: string]: string } = {};

    return axios.create({
        baseURL,
        // headers,
    });
};

export const getAPICarrier = (): AxiosInstance => {
    
    // const headers: { [key: string]: string } = {};

    return axios.create({
        baseURL: `${baseURL}/carrier`,
        // headers,
    });
};
