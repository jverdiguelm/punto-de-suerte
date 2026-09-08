const MAX_RESERVE_MINUTES=24*60

function validDate(value:unknown){
  return !value||!Number.isNaN(new Date(String(value)).getTime())
}

export function raffleValidationError(reserve:number,opensAt:unknown,closesAt:unknown){
  if(!Number.isInteger(reserve)||reserve<1||reserve>MAX_RESERVE_MINUTES)return `El apartado debe durar entre 1 y ${MAX_RESERVE_MINUTES} minutos.`
  if(!validDate(opensAt)||!validDate(closesAt))return 'La fecha de apertura o cierre no es válida.'
  if(opensAt&&closesAt&&new Date(String(opensAt))>=new Date(String(closesAt)))return 'La apertura debe ser anterior al cierre.'
  return null
}
