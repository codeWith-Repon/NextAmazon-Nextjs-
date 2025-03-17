import HomeCarousel from '@/components/shared/home/home-carousel'
import data from '@/lib/Data/data'
import React from 'react'

const page = () => {
  return (
    <HomeCarousel items={data.carousels} />
  )
}

export default page