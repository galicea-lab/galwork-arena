// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

const Home = () => {
  const router = useRouter()

  useEffect(
   () => {
      router.replace('/home')
    }, [router]
  )
  return null
}

export default Home
