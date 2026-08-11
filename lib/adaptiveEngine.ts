export type SkillState={mastery:number;confidence:number;difficulty:number;combo:number;errorTags:Record<string,number>}
export function applyAttempt(state:SkillState,correct:boolean,responseMs:number,tags:string[]):SkillState{
  const next={...state,errorTags:{...state.errorTags}}
  if(correct){
    next.combo+=1
    next.mastery=Math.min(100,next.mastery+(state.difficulty>=3?3:2))
    next.confidence=Math.min(100,next.confidence+3)
    if(responseMs<=12000 && next.combo>=2) next.difficulty=Math.min(5,next.difficulty+1)
  }else{
    next.combo=0
    next.mastery=Math.max(0,next.mastery-1)
    next.confidence=Math.max(0,next.confidence-2)
    next.difficulty=Math.max(1,next.difficulty-1)
    tags.forEach(t=>next.errorTags[t]=(next.errorTags[t]||0)+1)
  }
  return next
}
