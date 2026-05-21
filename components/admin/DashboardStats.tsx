import React from 'react'
import { Card } from '@/components/ui'

export type DashboardStatsProps = {
  pedidosHoy: number
  pedidosPendientes: number
  entregasHoy: number
  ingresosHoy: number
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DashboardStats({
  pedidosHoy,
  pedidosPendientes,
  entregasHoy,
  ingresosHoy,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Pedidos hoy */}
      <Card className="!overflow-visible">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-green-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-viflomax-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-nunito font-extrabold text-gray-900">{pedidosHoy}</p>
            <p className="text-sm font-outfit text-gray-500 mt-0.5">Pedidos hoy</p>
          </div>
        </div>
      </Card>

      {/* Pedidos pendientes */}
      <Card className="!overflow-visible">
        <div className="flex items-start gap-3">
          <div className={[
            'p-2.5 rounded-xl shrink-0',
            pedidosPendientes > 0 ? 'bg-yellow-100 animate-pulse' : 'bg-yellow-50',
          ].join(' ')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-nunito font-extrabold text-gray-900">{pedidosPendientes}</p>
            <p className="text-sm font-outfit text-gray-500 mt-0.5">Pendientes</p>
          </div>
        </div>
      </Card>

      {/* Entregas hoy */}
      <Card className="!overflow-visible">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-nunito font-extrabold text-gray-900">{entregasHoy}</p>
            <p className="text-sm font-outfit text-gray-500 mt-0.5">Entregas hoy</p>
          </div>
        </div>
      </Card>

      {/* Ingresos hoy */}
      <Card className="!overflow-visible">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-green-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-nunito font-extrabold text-gray-900 leading-tight">{formatCLP(ingresosHoy)}</p>
            <p className="text-sm font-outfit text-gray-500 mt-0.5">Ingresos hoy</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
