import { NextRequest, NextResponse } from 'next/server'
import { marketplaceApps } from '@/lib/data/marketplace-apps'
import { toolDetailParamsSchema } from '@/lib/validations/marketplace'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const validatedParams = toolDetailParamsSchema.parse(params)
    const { slug } = validatedParams

    const tool = marketplaceApps.find(app => app.id === slug)

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tool })
  } catch (error) {
    console.error('Error fetching tool detail:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
