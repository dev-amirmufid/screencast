import React from 'react'
import { useTranslation } from 'react-i18next'

const NotFound = () => {
    const {t} = useTranslation()
    return (
        <section className="flex items-center h-full p-16 bg-gray-100 text-gray-100 min-h-screen py-6  flex-col justify-center sm:py-12">
            <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
                <div className="text-center">
                    <h2 className="mb-8 font-extrabold text-9xl text-teal-600">
                        <span className="sr-only ">Error</span>404
                    </h2>
                    <p className="text-2xl text-gray-400 font-semibold md:text-3xl">{t('alert.text.page_not_found')}</p>
                </div>
            </div>
        </section>
    )
}

export default NotFound
