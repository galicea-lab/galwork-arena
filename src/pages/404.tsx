import { useEffect } from 'react'
import { useRouter } from 'next/router'

const Error404 = () => {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/home')
    }, 3000) // Redirect after 3 seconds

    return () => clearTimeout(timer) // Cleanup timer on component unmount
  }, [router])

  return (
   <div>
            Nie znaleziono strony. Za chwilę nastąpi przekierowanie na stronę główną...
    </div>
  )
}


export default Error404