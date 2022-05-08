import useSWR from 'swr';

export const useUser = () => useSWR('/user');
