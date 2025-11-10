export const useApi = () => {
  const config = useRuntimeConfig()
  const apiUrl = (config.public.apiUrl as string) || 'http://localhost:5000'
  
  return {
    apiUrl,
    apiBaseUrl: apiUrl + '/api',
    getUrl: (path: string) => `${apiUrl}${path}`
  }
}
