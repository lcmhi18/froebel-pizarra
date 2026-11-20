export const CONFIG={
 maxSteps:60,maxInput:4096,
 examples:['30 − [12 − (5 × 3 − 20)]','−8 + 5 × (−4) − 12 ÷ (−3)','3 × 2 − 7 + 5 × (12 − 20)','−2 × {3 − [17 − 5 × 2 − 32 ÷ 8]}'],
 colors:{parenthesis:'#007bbd',bracket:'#c75e00',brace:'#bd1987',highlight:'#fff02b'},
 drawing:{pen:{width:5,opacity:1},highlighter:{width:24,opacity:.4}},
 rules:[
  {key:'(',title:'Paréntesis',symbol:'( )',when:'Primero, resuelve lo que está dentro del paréntesis.',example:'(5 − 3) = 2'},
  {key:'[',title:'Corchetes',symbol:'[ ]',when:'Después del paréntesis, resuelve lo que está dentro del corchete.',example:'[8 − 6] = 2'},
  {key:'{',title:'Llaves',symbol:'{ }',when:'Después del corchete, resuelve lo que está dentro de la llave.',example:'{7 + 1} = 8'},
  {key:'md',title:'Multiplicar y dividir',symbol:'× ÷',when:'Antes que las sumas y restas, de izquierda a derecha.',example:'6 × 3 = 18'},
  {key:'as',title:'Sumar y restar',symbol:'+ −',when:'Al final, resuelve de izquierda a derecha.',example:'10 − 4 = 6'},
  {key:'sign',title:'Ley de signos',symbol:'±',when:'Al multiplicar o dividir números con signo.',example:'(−2) × (−3) = +6'},
 ],
 text:{initial:'Primero buscamos el signo de agrupación más interno.',multiply:'Primero las multiplicaciones y divisiones',add:'Ahora las sumas y restas, de izquierda a derecha',signMultiply:'Signos iguales dan +; distintos dan −.',signAdd:'Restar un número negativo equivale a sumarlo.',finished:'¡Listo! La respuesta es'},
};
