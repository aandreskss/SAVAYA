'use client'

import Image, { type ImageProps } from 'next/image'
import { cloudinaryCoverLoader, cloudinaryContainLoader } from '@/lib/cloudinary'

interface CloudinaryImageProps extends Omit<ImageProps, 'loader'> {
  contain?: boolean
}

export default function CloudinaryImage({ contain, ...props }: CloudinaryImageProps) {
  return <Image loader={contain ? cloudinaryContainLoader : cloudinaryCoverLoader} {...props} />
}
