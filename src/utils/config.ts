import axios from 'axios';
import { AxiosInstance } from 'axios';
// import env from './env';

// const baseURL = import.meta.env.VUE_APP_API_URL;
const baseURL = 'insérer url de lapi ici';

export const getAPI = (): AxiosInstance => {
    // const headers: { [key: string]: string } = {};

    return axios.create({
        baseURL,
        // headers,
    });
};

