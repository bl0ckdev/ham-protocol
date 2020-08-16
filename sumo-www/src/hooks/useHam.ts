import { useContext } from 'react'
import { Context } from '../contexts/SumoProvider'

const useSumo = () => {
  const { sumo } = useContext(Context)
  return sumo
}

export default useSumo
