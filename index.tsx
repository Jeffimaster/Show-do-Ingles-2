import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Loader2, 
  Trophy, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Play,
  RefreshCw,
  FastForward,
  Divide,
  User,
  ListOrdered,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

// --- Types ---

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
}

interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

type GameState = 'START' | 'LOADING' | 'PLAYING' | 'FEEDBACK' | 'GAME_OVER' | 'VICTORY';

interface Lifelines {
  fiftyFifty: boolean;
  skips: number;
  hint: boolean;
}

// --- Configuration ---

const PRIZE_LADDER = [
  1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000
];

// --- Static Question Bank ---

const QUESTION_BANK: Question[] = [
  // --- EASY (Nível 1-3) ---
  { id: 'e1', level: 'easy', text: "Como se diz 'Vermelho' em inglês?", options: ["Blue", "Red", "Green", "Yellow"], correctIndex: 1, explanation: "'Red' é a tradução direta de vermelho.", hint: "É a cor do sangue e do morango." },
  { id: 'e2', level: 'easy', text: "Qual é a tradução de 'Dog'?", options: ["Gato", "Pássaro", "Cachorro", "Peixe"], correctIndex: 2, explanation: "'Dog' significa cachorro.", hint: "É conhecido como o melhor amigo do homem." },
  { id: 'e3', level: 'easy', text: "Complete: 'I ___ happy today.'", options: ["is", "are", "am", "be"], correctIndex: 2, explanation: "O verbo 'to be' conjugado para a primeira pessoa (I) é 'am'.", hint: "Conjugação do verbo to be para 'Eu'." },
  { id: 'e4', level: 'easy', text: "Como se diz 'Obrigado'?", options: ["Please", "Sorry", "Excuse me", "Thank you"], correctIndex: 3, explanation: "'Thank you' é obrigado.", hint: "Você diz isso quando alguém faz um favor para você." },
  { id: 'e5', level: 'easy', text: "Qual destes é um dia da semana?", options: ["January", "Monday", "Summer", "Morning"], correctIndex: 1, explanation: "'Monday' é Segunda-feira.", hint: "Começa com M e é o primeiro dia útil." },
  { id: 'e6', level: 'easy', text: "O que significa 'Book'?", options: ["Mesa", "Cadeira", "Livro", "Caneta"], correctIndex: 2, explanation: "'Book' é livro.", hint: "Você usa para ler histórias ou estudar." },
  { id: 'e7', level: 'easy', text: "Qual é o oposto de 'Big'?", options: ["Small", "Large", "Huge", "Tall"], correctIndex: 0, explanation: "'Small' (Pequeno) é o oposto de 'Big'.", hint: "Pense em algo minúsculo." },
  { id: 'e8', level: 'easy', text: "Como se diz 'Bom dia'?", options: ["Good night", "Good afternoon", "Good morning", "Goodbye"], correctIndex: 2, explanation: "'Good morning' se usa pela manhã.", hint: "A saudação quando o sol nasce." },
  { id: 'e9', level: 'easy', text: "Qual é a tradução de 'Water'?", options: ["Leite", "Suco", "Água", "Refrigerante"], correctIndex: 2, explanation: "'Water' significa água.", hint: "Essencial para a vida, bebemos quando temos sede." },
  { id: 'e10', level: 'easy', text: "Como se escreve o número 12?", options: ["Ten", "Twelve", "Twenty", "Two"], correctIndex: 1, explanation: "12 é 'Twelve'.", hint: "Vem depois do Eleven." },
  { id: 'e11', level: 'easy', text: "O que significa 'Sister'?", options: ["Irmão", "Mãe", "Tia", "Irmã"], correctIndex: 3, explanation: "'Sister' é Irmã.", hint: "Filha dos seus pais." },
  { id: 'e12', level: 'easy', text: "Qual é a cor do Sol (Sun)?", options: ["Blue", "Green", "Yellow", "Purple"], correctIndex: 2, explanation: "O sol é 'Yellow' (Amarelo).", hint: "A cor de uma banana madura." },
  { id: 'e13', level: 'easy', text: "Traduza: 'I like to eat pizza'.", options: ["Eu odeio pizza", "Eu gosto de comer pizza", "Eu faço pizza", "Eu compro pizza"], correctIndex: 1, explanation: "'Like' é gostar e 'Eat' é comer.", hint: "Expressa uma preferência alimentar." },
  { id: 'e14', level: 'easy', text: "O que é uma 'Table'?", options: ["Cadeira", "Mesa", "Janela", "Porta"], correctIndex: 1, explanation: "'Table' é Mesa.", hint: "Onde colocamos o prato para comer." },
  { id: 'e15', level: 'easy', text: "Qual o plural de 'Car'?", options: ["Cars", "Cares", "Car", "Carves"], correctIndex: 0, explanation: "Adiciona-se 'S' no plural regular.", hint: "Basta adicionar uma letra no final." },
  { id: 'e16', level: 'easy', text: "Como se diz 'Tchau'?", options: ["Hello", "Hi", "Goodbye", "Welcome"], correctIndex: 2, explanation: "'Goodbye' é adeus/tchau.", hint: "O oposto de Hello." },
  { id: 'e17', level: 'easy', text: "O que significa 'Apple'?", options: ["Laranja", "Banana", "Maçã", "Uva"], correctIndex: 2, explanation: "'Apple' é Maçã.", hint: "A fruta da Branca de Neve." },
  { id: 'e18', level: 'easy', text: "Complete: 'She ___ my friend.'", options: ["are", "am", "is", "be"], correctIndex: 2, explanation: "Para 'She' usa-se 'is'.", hint: "Conjugação singular para ela." },
  { id: 'e19', level: 'easy', text: "O que significa 'Cat'?", options: ["Cachorro", "Gato", "Pato", "Leão"], correctIndex: 1, explanation: "'Cat' significa Gato.", hint: "Animal que faz miau." },
  { id: 'e20', level: 'easy', text: "Traduza: 'Blue'", options: ["Vermelho", "Azul", "Preto", "Branco"], correctIndex: 1, explanation: "'Blue' é Azul.", hint: "A cor do céu." },
  { id: 'e21', level: 'easy', text: "Qual número é 'One'?", options: ["1", "2", "3", "4"], correctIndex: 0, explanation: "'One' é o número 1.", hint: "O primeiro número." },
  { id: 'e22', level: 'easy', text: "O que significa 'Milk'?", options: ["Água", "Suco", "Leite", "Refrigerante"], correctIndex: 2, explanation: "'Milk' é Leite.", hint: "Bebida branca que vem da vaca." },
  { id: 'e23', level: 'easy', text: "Como se diz 'Casa'?", options: ["House", "Mouse", "Horse", "Rose"], correctIndex: 0, explanation: "'House' é Casa.", hint: "Onde você mora." },
  { id: 'e24', level: 'easy', text: "O que significa 'Boy'?", options: ["Menina", "Mulher", "Menino", "Homem"], correctIndex: 2, explanation: "'Boy' é Menino.", hint: "Oposto de Girl." },
  { id: 'e25', level: 'easy', text: "Qual é a tradução de 'Night'?", options: ["Dia", "Tarde", "Noite", "Manhã"], correctIndex: 2, explanation: "'Night' é Noite.", hint: "Quando a lua aparece." },
  { id: 'e26', level: 'easy', text: "O que significa 'Love'?", options: ["Ódio", "Amor", "Vida", "Paz"], correctIndex: 1, explanation: "'Love' é Amor.", hint: "Sentimento do coração." },
  { id: 'e27', level: 'easy', text: "Como se diz 'Professor'?", options: ["Student", "Doctor", "Teacher", "Driver"], correctIndex: 2, explanation: "'Teacher' é Professor.", hint: "Pessoa que ensina na escola." },
  { id: 'e28', level: 'easy', text: "O que é 'Fish'?", options: ["Carne", "Frango", "Peixe", "Salada"], correctIndex: 2, explanation: "'Fish' é Peixe.", hint: "Animal que nada na água." },
  { id: 'e29', level: 'easy', text: "Traduza: 'Door'", options: ["Janela", "Paredes", "Porta", "Teto"], correctIndex: 2, explanation: "'Door' é Porta.", hint: "Você abre para entrar em casa." },
  { id: 'e30', level: 'easy', text: "O que significa 'Happy'?", options: ["Triste", "Bravo", "Feliz", "Cansado"], correctIndex: 2, explanation: "'Happy' é Feliz.", hint: "Oposto de triste." },
  { id: 'e31', level: 'easy', text: "Qual a cor 'Black'?", options: ["Branco", "Preto", "Cinza", "Marrom"], correctIndex: 1, explanation: "'Black' é Preto.", hint: "A cor da escuridão." },
  { id: 'e32', level: 'easy', text: "O que significa 'Money'?", options: ["Comida", "Tempo", "Dinheiro", "Trabalho"], correctIndex: 2, explanation: "'Money' é Dinheiro.", hint: "Usado para comprar coisas." },
  { id: 'e33', level: 'easy', text: "Como se diz 'Mãe'?", options: ["Father", "Sister", "Mother", "Brother"], correctIndex: 2, explanation: "'Mother' é Mãe.", hint: "A mulher que te deu à luz." },
  { id: 'e34', level: 'easy', text: "O que é 'Pen'?", options: ["Lápis", "Caneta", "Borracha", "Caderno"], correctIndex: 1, explanation: "'Pen' é Caneta. Lápis é Pencil.", hint: "Usada para escrever com tinta." },
  { id: 'e35', level: 'easy', text: "Traduza 'Bed'", options: ["Banheiro", "Cama", "Sofá", "Cadeira"], correctIndex: 1, explanation: "'Bed' é Cama.", hint: "Onde você dorme." },
  { id: 'e36', level: 'easy', text: "O que significa 'Sun'?", options: ["Lua", "Estrela", "Sol", "Céu"], correctIndex: 2, explanation: "'Sun' é Sol.", hint: "Brilha no céu durante o dia." },
  { id: 'e37', level: 'easy', text: "Como se diz 'Amigo'?", options: ["Enemy", "Friend", "Neighbor", "Boss"], correctIndex: 1, explanation: "'Friend' é Amigo.", hint: "Alguém que você gosta e confia." },
  { id: 'e38', level: 'easy', text: "O que significa 'Cold'?", options: ["Quente", "Frio", "Morno", "Seco"], correctIndex: 1, explanation: "'Cold' é Frio.", hint: "Oposto de quente (Hot)." },
  { id: 'e39', level: 'easy', text: "Qual a tradução de 'Tree'?", options: ["Flor", "Grama", "Árvore", "Folha"], correctIndex: 2, explanation: "'Tree' é Árvore.", hint: "Tem tronco e folhas." },
  { id: 'e40', level: 'easy', text: "Complete: '___ name is John.'", options: ["I", "Me", "My", "Mine"], correctIndex: 2, explanation: "'My' é o possessivo 'Meu'.", hint: "Indica posse do nome." },

  // --- MEDIUM (Nível 4-6) ---
  { id: 'm1', level: 'medium', text: "Qual é o passado de 'Go'?", options: ["Goed", "Gone", "Went", "Going"], correctIndex: 2, explanation: "'Went' é o passado irregular de Go.", hint: "Irregular, começa com W." },
  { id: 'm2', level: 'medium', text: "O que significa 'Parents'?", options: ["Parentes", "Pais", "Parceiros", "Primos"], correctIndex: 1, explanation: "'Parents' são Pais (pai e mãe).", hint: "Falso cognato para 'parentes'." },
  { id: 'm3', level: 'medium', text: "'The book is ___ the table.'", options: ["in", "on", "at", "to"], correctIndex: 1, explanation: "'On' indica sobre a superfície.", hint: "Está em cima." },
  { id: 'm4', level: 'medium', text: "Traduza 'Breakfast'", options: ["Pausa", "Café da manhã", "Freio", "Jantar"], correctIndex: 1, explanation: "Primeira refeição do dia.", hint: "Refeição matinal." },
  { id: 'm5', level: 'medium', text: "Qual frase é Present Continuous?", options: ["I play", "I am playing", "I played", "I will play"], correctIndex: 1, explanation: "Requer verbo to be + ing.", hint: "Ação acontecendo agora." },
  { id: 'm6', level: 'medium', text: "O que significa 'Library'?", options: ["Livraria", "Biblioteca", "Liberdade", "Laboratório"], correctIndex: 1, explanation: "'Library' é onde emprestamos livros.", hint: "Falso cognato. Livraria é Bookstore." },
  { id: 'm7', level: 'medium', text: "Complete: 'She ___ speak English.'", options: ["can", "cans", "to can", "canning"], correctIndex: 0, explanation: "Modais não levam 'S'.", hint: "Verbo poder/conseguir." },
  { id: 'm8', level: 'medium', text: "O que significa 'Push'?", options: ["Puxar", "Empurrar", "Pular", "Pegar"], correctIndex: 1, explanation: "'Push' é Empurrar.", hint: "Falso cognato. Oposto de Pull." },
  { id: 'm9', level: 'medium', text: "Passado de 'Buy'?", options: ["Buyed", "Bought", "Brought", "Buying"], correctIndex: 1, explanation: "'Bought' é o passado de comprar.", hint: "Irregular, rima com Thought." },
  { id: 'm10', level: 'medium', text: "O que significa 'Lunch'?", options: ["Lanche", "Almoço", "Jantar", "Ceia"], correctIndex: 1, explanation: "'Lunch' é Almoço.", hint: "Falso cognato. Lanche é Snack." },
  { id: 'm11', level: 'medium', text: "Comparativo de 'Good'?", options: ["Gooder", "More good", "Better", "Best"], correctIndex: 2, explanation: "Good -> Better -> Best.", hint: "Melhor que..." },
  { id: 'm12', level: 'medium', text: "O que significa 'Fabric'?", options: ["Fábrica", "Tecido", "Fabricar", "Tijolo"], correctIndex: 1, explanation: "'Fabric' é Tecido. Fábrica é Factory.", hint: "Material de roupa." },
  { id: 'm13', level: 'medium', text: "Complete: 'I will ___ travel.'", options: ["probably", "yesterday", "last week", "ago"], correctIndex: 0, explanation: "'Probably' combina com futuro.", hint: "Indica probabilidade futura." },
  { id: 'm14', level: 'medium', text: "O que é um 'Mayor'?", options: ["Maior", "Prefeito", "Melhor", "Major"], correctIndex: 1, explanation: "'Mayor' é Prefeito.", hint: "Chefe da cidade." },
  { id: 'm15', level: 'medium', text: "Traduza: 'I have a cold.'", options: ["Estou com frio", "Tenho um resfriado", "Tenho gelo", "Sou frio"], correctIndex: 1, explanation: "'A cold' é um resfriado.", hint: "Doença comum." },
  { id: 'm16', level: 'medium', text: "'I was born ___ May.'", options: ["on", "at", "in", "to"], correctIndex: 2, explanation: "Meses usam 'in'.", hint: "Preposição para meses e anos." },
  { id: 'm17', level: 'medium', text: "Passado de 'Sleep'?", options: ["Sleeped", "Slept", "Slap", "Slope"], correctIndex: 1, explanation: "'Slept' é o passado de dormir.", hint: "Verbo irregular." },
  { id: 'm18', level: 'medium', text: "O que significa 'Exit'?", options: ["Sucesso", "Existir", "Saída", "Exitar"], correctIndex: 2, explanation: "'Exit' é Saída.", hint: "Placa comum em portas." },
  { id: 'm19', level: 'medium', text: "Plural de 'Child'?", options: ["Childs", "Children", "Childrens", "Childes"], correctIndex: 1, explanation: "'Children' é plural irregular.", hint: "Mais de uma criança." },
  { id: 'm20', level: 'medium', text: "O que significa 'Pretend'?", options: ["Pretender", "Fingir", "Prender", "Entender"], correctIndex: 1, explanation: "'Pretend' é Fingir.", hint: "Falso cognato. O que atores fazem." },
  { id: 'm21', level: 'medium', text: "Qual a tradução de 'Shoot'?", options: ["Chutar", "Atirar/Filmar", "Gritar", "Pular"], correctIndex: 1, explanation: "'Shoot' pode ser atirar ou filmar. Chutar é Kick.", hint: "Ação com arma ou câmera." },
  { id: 'm22', level: 'medium', text: "Complete: 'He ___ work yesterday.'", options: ["doesn't", "don't", "didn't", "won't"], correctIndex: 2, explanation: "'Didn't' é o auxiliar de negação no passado.", hint: "Passado negativo." },
  { id: 'm23', level: 'medium', text: "O que significa 'Legend'?", options: ["Legenda", "Lenda", "Legião", "Leve"], correctIndex: 1, explanation: "'Legend' é Lenda. Legenda é Subtitle.", hint: "História antiga ou mito." },
  { id: 'm24', level: 'medium', text: "Traduza 'Vegetables'", options: ["Vegetais/Legumes", "Vegetação", "Vegano", "Velocidade"], correctIndex: 0, explanation: "São legumes e verduras.", hint: "Comida saudável." },
  { id: 'm25', level: 'medium', text: "O que significa 'Pull'?", options: ["Pular", "Puxar", "Empurrar", "Colocar"], correctIndex: 1, explanation: "'Pull' é Puxar.", hint: "Oposto de Push." },
  { id: 'm26', level: 'medium', text: "Qual o plural de 'Woman'?", options: ["Womans", "Women", "Womens", "Girl"], correctIndex: 1, explanation: "Plural irregular, muda 'a' para 'e'.", hint: "Pronuncia-se 'uí-men'." },
  { id: 'm27', level: 'medium', text: "O que significa 'Costume'?", options: ["Costume", "Hábito", "Fantasia", "Costura"], correctIndex: 2, explanation: "'Costume' é Fantasia.", hint: "Roupa de Halloween." },
  { id: 'm28', level: 'medium', text: "Complete: 'How ___ money?'", options: ["many", "much", "long", "often"], correctIndex: 1, explanation: "Dinheiro é incontável, usa-se 'much'.", hint: "Para coisas incontáveis." },
  { id: 'm29', level: 'medium', text: "O que significa 'Tax'?", options: ["Táxi", "Imposto", "Taxa", "Texto"], correctIndex: 1, explanation: "'Tax' é Imposto.", hint: "Dinheiro pago ao governo." },
  { id: 'm30', level: 'medium', text: "Traduza 'Actually'", options: ["Atualmente", "Na verdade", "Ação", "Atuante"], correctIndex: 1, explanation: "'Actually' é 'Na verdade'. Atualmente é Currently.", hint: "Usado para corrigir algo." },
  { id: 'm31', level: 'medium', text: "Passado de 'Drink'?", options: ["Drinked", "Drank", "Drunk", "Dronk"], correctIndex: 1, explanation: "'Drank' é o passado simples de beber.", hint: "Muda o I pelo A." },
  { id: 'm32', level: 'medium', text: "O que significa 'Attend'?", options: ["Atender", "Assistir/Participar", "Esperar", "Entender"], correctIndex: 1, explanation: "'Attend' é comparecer/participar.", hint: "Falso cognato. Atender é Answer." },
  { id: 'm33', level: 'medium', text: "Complete: 'We are ___ to the beach.'", options: ["go", "gone", "going", "went"], correctIndex: 2, explanation: "Present Continuous: are going.", hint: "Futuro planejado ou ação agora." },
  { id: 'm34', level: 'medium', text: "O que é 'Knife'?", options: ["Garfo", "Colher", "Faca", "Prato"], correctIndex: 2, explanation: "'Knife' é Faca.", hint: "Cortar comida." },
  { id: 'm35', level: 'medium', text: "Qual a tradução de 'Notice'?", options: ["Notícia", "Notar/Aviso", "Noite", "Novo"], correctIndex: 1, explanation: "'Notice' é notar ou aviso. Notícia é News.", hint: "Perceber algo." },

  // --- HARD (Nível 7-8) ---
  { id: 'h1', level: 'hard', text: "Qual frase é Present Perfect?", options: ["I saw", "I have seen", "I had seen", "I see"], correctIndex: 1, explanation: "Have/Has + Particípio.", hint: "Auxiliar Have presente." },
  { id: 'h2', level: 'hard', text: "O que significa 'Pretend'?", options: ["Pretender", "Fingir", "Prender", "Entender"], correctIndex: 1, explanation: "'Pretend' é Fingir.", hint: "Falso cognato." },
  { id: 'h3', level: 'hard', text: "'If I ___ you, I would go.'", options: ["was", "am", "were", "be"], correctIndex: 2, explanation: "Subjuntivo 'Were' para hipóteses.", hint: "Condicional tipo 2." },
  { id: 'h4', level: 'hard', text: "Phrasal Verb 'Give up'?", options: ["Dar cima", "Desistir", "Levantar", "Começar"], correctIndex: 1, explanation: "Desistir de algo.", hint: "Parar de tentar." },
  { id: 'h5', level: 'hard', text: "Traduza 'Actually'", options: ["Atualmente", "Na verdade", "Ação", "Agilidade"], correctIndex: 1, explanation: "'Na verdade'.", hint: "Correção de fato." },
  { id: 'h6', level: 'hard', text: "Voz Passiva: 'The cake ___ made.'", options: ["was", "did", "has", "is being"], correctIndex: 0, explanation: "'Was made' (Foi feito).", hint: "Passado passivo." },
  { id: 'h7', level: 'hard', text: "Significado de 'Eventually'?", options: ["Eventualmente", "Finalmente", "Talvez", "Ocasionalmente"], correctIndex: 1, explanation: "'No final das contas'.", hint: "Falso cognato." },
  { id: 'h8', level: 'hard', text: "Diferença 'Say' vs 'Tell'?", options: ["Nenhuma", "Tell precisa de receptor", "Say precisa de receptor", "Tell é mentira"], correctIndex: 1, explanation: "Tell someone something.", hint: "Tell ME." },
  { id: 'h9', level: 'hard', text: "'Run out of' significa?", options: ["Correr fora", "Expulsar", "Ficar sem/Esgotar", "Fugir"], correctIndex: 2, explanation: "Acabar o estoque.", hint: "Quando acaba a gasolina." },
  { id: 'h10', level: 'hard', text: "'I am used to ___'", options: ["wake up", "waking up", "woke up", "wakes up"], correctIndex: 1, explanation: "'Be used to' exige gerúndio (ING).", hint: "Hábito atual." },
  { id: 'h11', level: 'hard', text: "O que significa 'Exquisite'?", options: ["Esquisito", "Feio", "Refinado/Belo", "Exausto"], correctIndex: 2, explanation: "Algo belo e delicado.", hint: "Não é esquisito." },
  { id: 'h12', level: 'hard', text: "'You ___ smoke here. Forbidden.'", options: ["don't have to", "mustn't", "shouldn't", "couldn't"], correctIndex: 1, explanation: "'Mustn't' é proibição.", hint: "Regra estrita." },
  { id: 'h13', level: 'hard', text: "'Application' (emprego)?", options: ["Aplicativo", "Investimento", "Candidatura", "Esforço"], correctIndex: 2, explanation: "Inscrição para vaga.", hint: "Formulário de emprego." },
  { id: 'h14', level: 'hard', text: "Oposto de 'Lend'?", options: ["Give", "Borrow", "Take", "Send"], correctIndex: 1, explanation: "Lend (dar emprestado) x Borrow (pegar emprestado).", hint: "Pegar emprestado." },
  { id: 'h15', level: 'hard', text: "'Look forward to'?", options: ["Olhar frente", "Estar ansioso por", "Procurar", "Esquecer"], correctIndex: 1, explanation: "Esperar com ansiedade.", hint: "Comum em emails." },
  { id: 'h16', level: 'hard', text: "Tag Question: 'She is nice, ___?'", options: ["isn't she", "is she", "does she", "didn't she"], correctIndex: 0, explanation: "Positivo vira negativo.", hint: "Inverte o verbo to be." },
  { id: 'h17', level: 'hard', text: "O que significa 'Hardly'?", options: ["Dificilmente/Quase não", "Duro", "Forte", "Trabalhoso"], correctIndex: 0, explanation: "Sentido negativo.", hint: "Hardly ever = quase nunca." },
  { id: 'h18', level: 'hard', text: "'Unless' significa?", options: ["A menos que", "Se", "Quando", "Apesar"], correctIndex: 0, explanation: "Condicional negativa (If not).", hint: "Exceção." },
  { id: 'h19', level: 'hard', text: "Phrasal Verb 'Call off'?", options: ["Chamar", "Cancelar", "Gritar", "Telefonar"], correctIndex: 1, explanation: "Cancelar um evento.", hint: "O jogo foi 'called off' por chuva." },
  { id: 'h20', level: 'hard', text: "'I wish I ___ known.'", options: ["have", "had", "has", "would"], correctIndex: 1, explanation: "Past Perfect para arrependimento.", hint: "Gostaria que tivesse..." },
  { id: 'h21', level: 'hard', text: "O que é 'Comprehensive'?", options: ["Compreensivo", "Abrangente/Completo", "Comprido", "Entendedor"], correctIndex: 1, explanation: "Que cobre tudo.", hint: "Falso cognato. Compreensivo é Understanding." },
  { id: 'h22', level: 'hard', text: "Traduza 'Idiom'", options: ["Idioma", "Idiota", "Expressão Idiomática", "Ideia"], correctIndex: 2, explanation: "Expressão fixa.", hint: "Idioma é Language." },
  { id: 'h23', level: 'hard', text: "'By the time you arrive, I ___.'", options: ["will leave", "left", "will have left", "leave"], correctIndex: 2, explanation: "Future Perfect.", hint: "Ação terminada no futuro." },
  { id: 'h24', level: 'hard', text: "O que significa 'Resume'?", options: ["Resumir", "Currículo", "Resumo", "Recomeçar"], correctIndex: 3, explanation: "Como verbo é recomeçar. Como substantivo (Résumé) é currículo.", hint: "Continuar após pausa." },
  { id: 'h25', level: 'hard', text: "O que significa 'Realize'?", options: ["Realizar", "Perceber", "Realeza", "Real"], correctIndex: 1, explanation: "Dar-se conta de algo.", hint: "Falso cognato. Realizar é Accomplish." },
  { id: 'h26', level: 'hard', text: "Qual a tradução de 'Policy'?", options: ["Polícia", "Política (Diretriz)", "Polidez", "Polir"], correctIndex: 1, explanation: "Regras ou diretrizes.", hint: "Política de privacidade." },
  { id: 'h27', level: 'hard', text: "'Look after' significa?", options: ["Olhar depois", "Cuidar de", "Procurar", "Parecer"], correctIndex: 1, explanation: "Tomar conta.", hint: "Cuidar de crianças ou pets." },
  { id: 'h28', level: 'hard', text: "'Despite' significa?", options: ["Desprezo", "Apesar de", "Despesa", "Depois"], correctIndex: 1, explanation: "Concessão.", hint: "Sinônimo de In spite of." },
  { id: 'h29', level: 'hard', text: "'Put up with' significa?", options: ["Colocar cima", "Tolerar", "Construir", "Hospedar"], correctIndex: 1, explanation: "Aceitar algo chato.", hint: "Não aguento mais (can't put up with)." },
  { id: 'h30', level: 'hard', text: "O que significa 'Data'?", options: ["Data", "Dados", "Dívida", "Dedo"], correctIndex: 1, explanation: "Informações.", hint: "Falso cognato. Data do calendário é Date." },

  // --- EXPERT (Nível 9-10) ---
  { id: 'x1', level: 'expert', text: "'Piece of cake'?", options: ["Bolo", "Muito fácil", "Mentira", "Delicioso"], correctIndex: 1, explanation: "Algo muito fácil.", hint: "Moleza." },
  { id: 'x2', level: 'expert', text: "'Break a leg'?", options: ["Quebre a perna", "Boa sorte", "Vá ao médico", "Desista"], correctIndex: 1, explanation: "Boa sorte (teatro).", hint: "Desejo irônico." },
  { id: 'x3', level: 'expert', text: "Inversão correta?", options: ["Never I have", "Never have I", "I have never", "Seen never I"], correctIndex: 1, explanation: "Ênfase negativa inverte auxiliar.", hint: "Formal." },
  { id: 'x4', level: 'expert', text: "'Call it a day'?", options: ["Ligar dia", "Parar de trabalhar", "Chamar nome", "Marcar data"], correctIndex: 1, explanation: "Encerrar por hoje.", hint: "Ir para casa." },
  { id: 'x5', level: 'expert', text: "Diferença Make vs Do?", options: ["Nenhuma", "Make=Criar, Do=Ação", "Make=Ação, Do=Criar", "Make=Formal"], correctIndex: 1, explanation: "Make foca no produto, Do no processo.", hint: "Make a cake, Do homework." },
  { id: 'x6', level: 'expert', text: "'Once in a blue moon'?", options: ["Toda noite", "Raramente", "Sempre", "Nunca"], correctIndex: 1, explanation: "Muito raro.", hint: "Evento lunar raro." },
  { id: 'x7', level: 'expert', text: "'Bite the bullet'?", options: ["Morder bala", "Encarar dificuldade", "Comer rápido", "Desistir"], correctIndex: 1, explanation: "Encarar o inevitável.", hint: "Coragem na dor." },
  { id: 'x8', level: 'expert', text: "'Hit the sack'?", options: ["Bater saco", "Ir dormir", "Demitido", "Trabalhar"], correctIndex: 1, explanation: "Ir para a cama.", hint: "Gíria para dormir." },
  { id: 'x9', level: 'expert', text: "'Cost an arm and a leg'?", options: ["Partes do corpo", "Barato", "Muito caro", "De graça"], correctIndex: 2, explanation: "Preço exorbitante.", hint: "Custa membros." },
  { id: 'x10', level: 'expert', text: "'Sitting on the fence'?", options: ["Sentado cerca", "Indeciso", "Protegendo", "Caindo"], correctIndex: 1, explanation: "Não tomar partido.", hint: "Em cima do muro." },
  { id: 'x11', level: 'expert', text: "'Under the weather'?", options: ["Debaixo tempo", "Doente/Mal", "Na chuva", "Com pressa"], correctIndex: 1, explanation: "Sentindo-se mal.", hint: "Levemente doente." },
  { id: 'x12', level: 'expert', text: "'Barking up the wrong tree'?", options: ["Latindo árvore", "Acusando errado", "Caçando", "Gritando"], correctIndex: 1, explanation: "Seguindo pista falsa.", hint: "Cachorro confuso." },
  { id: 'x13', level: 'expert', text: "'Had I known, I ___ gone.'", options: ["would have", "will have", "would", "had"], correctIndex: 0, explanation: "Condicional 3 invertida.", hint: "Consequência passada." },
  { id: 'x14', level: 'expert', text: "'Spill the beans'?", options: ["Derrubar feijão", "Cozinhar", "Revelar segredo", "Mentir"], correctIndex: 2, explanation: "Contar a verdade.", hint: "Dar com a língua nos dentes." },
  { id: 'x15', level: 'expert', text: "'Cold turkey'?", options: ["Peru frio", "Parar vício abruptamente", "Comida", "Frio"], correctIndex: 1, explanation: "Parar de uma vez.", hint: "Abstinência súbita." },
  { id: 'x16', level: 'expert', text: "'Burn the midnight oil'?", options: ["Queimar óleo", "Trabalhar até tarde", "Cozinhar", "Dormir cedo"], correctIndex: 1, explanation: "Estudar ou trabalhar noite adentro.", hint: "Lâmpada a óleo à noite." },
  { id: 'x17', level: 'expert', text: "'Cut corners'?", options: ["Cortar cantos", "Fazer mal feito/Economizar", "Dirigir", "Arquitetura"], correctIndex: 1, explanation: "Fazer rápido e barato, sacrificando qualidade.", hint: "Atalhos perigosos." },
  { id: 'x18', level: 'expert', text: "'Miss the boat'?", options: ["Perder o barco", "Perder a oportunidade", "Navegar", "Chegar tarde"], correctIndex: 1, explanation: "Perder a chance.", hint: "O navio já partiu." },
  { id: 'x19', level: 'expert', text: "'The best of both worlds'?", options: ["Melhor dos mundos", "Viagem espacial", "Rico", "Dois planetas"], correctIndex: 0, explanation: "Vantagens de duas situações diferentes.", hint: "Ter tudo." },
  { id: 'x20', level: 'expert', text: "'Feeling blue'?", options: ["Sentindo azul", "Triste/Deprimido", "Com frio", "Calmo"], correctIndex: 1, explanation: "Estar triste.", hint: "Cor da tristeza." },
  { id: 'x21', level: 'expert', text: "'See eye to eye'?", options: ["Olho no olho", "Concordar plenamente", "Discutir", "Encarar"], correctIndex: 1, explanation: "Ter a mesma opinião.", hint: "Visão igual." },
  { id: 'x22', level: 'expert', text: "'Kill two birds with one stone'?", options: ["Matar pássaros", "Dois coelhos com uma cajadada", "Caçar", "Crueldade"], correctIndex: 1, explanation: "Resolver dois problemas de uma vez.", hint: "Eficiência." },
  { id: 'x23', level: 'expert', text: "'Let the cat out of the bag'?", options: ["Soltar o gato", "Revelar segredo", "Comprar pet", "Perder algo"], correctIndex: 1, explanation: "Revelar algo acidentalmente.", hint: "Similar a Spill the beans." },
  { id: 'x24', level: 'expert', text: "'To sit tight'?", options: ["Sentar apertado", "Esperar pacientemente", "Ficar nervoso", "Espremer"], correctIndex: 1, explanation: "Aguardar sem agir.", hint: "Não se mova." },
  { id: 'x25', level: 'expert', text: "O que significa 'Serendipity'?", options: ["Serenidade", "Sorte/Acaso feliz", "Seriedade", "Servidão"], correctIndex: 1, explanation: "Encontrar algo bom por acaso.", hint: "Golpe de sorte." },
  { id: 'x26', level: 'expert', text: "O que é 'Ephemeral'?", options: ["Efeminado", "Efêmero/Passageiro", "Eterno", "Doença"], correctIndex: 1, explanation: "Que dura pouco.", hint: "Passageiro." },
  { id: 'x27', level: 'expert', text: "Diferença Further vs Farther?", options: ["Iguais", "Farther=Físico, Further=Metafórico", "Farther=Metafórico", "Nenhuma"], correctIndex: 1, explanation: "Farther (distância), Further (adicional).", hint: "Far = longe." },
  { id: 'x28', level: 'expert', text: "Uso de 'Whom'?", options: ["Sujeito", "Objeto", "Verbo", "Adjetivo"], correctIndex: 1, explanation: "Whom é usado como objeto (To whom).", hint: "Substitui 'Him/Her'." },
  { id: 'x29', level: 'expert', text: "'Actions speak louder than ___'?", options: ["voice", "words", "thoughts", "screams"], correctIndex: 1, explanation: "Ações valem mais que palavras.", hint: "Provérbio famoso." },
  { id: 'x30', level: 'expert', text: "'Ubiquitous' significa?", options: ["Raro", "Onipresente", "Único", "Líquido"], correctIndex: 1, explanation: "Que está em todo lugar.", hint: "Comum." }
];

// --- Helper Functions ---

const getDifficultyForIndex = (index: number): 'easy' | 'medium' | 'hard' | 'expert' => {
  if (index < 3) return 'easy';
  if (index < 6) return 'medium';
  if (index < 9) return 'hard';
  return 'expert';
};

const getStaticQuestion = (index: number, usedIds: string[]): Question => {
  const level = getDifficultyForIndex(index);
  
  // Filter questions by current level
  const availableQuestions = QUESTION_BANK.filter(
    q => q.level === level && !usedIds.includes(q.id)
  );

  // If we run out of questions for a level (fallback), reuse questions but try not to pick the immediate last one if possible
  const pool = availableQuestions.length > 0 
    ? availableQuestions 
    : QUESTION_BANK.filter(q => q.level === level);

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  className = '' 
}: { 
  children?: React.ReactNode, 
  onClick: () => void, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'correct' | 'wrong',
  disabled?: boolean,
  className?: string
}) => {
  const baseStyles = "relative overflow-hidden px-6 py-4 rounded-2xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 shadow-xl backdrop-blur-sm group select-none touch-manipulation";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-indigo-500/30 border border-white/10",
    secondary: "bg-slate-800/80 text-white hover:bg-slate-700 shadow-black/20 border border-white/5",
    outline: "border-2 border-white/20 text-white hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-200",
    ghost: "bg-transparent text-slate-400 hover:text-white shadow-none",
    correct: "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-green-500/40 border border-emerald-400/30 animate-pulse",
    wrong: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/40 border border-red-400/30"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </button>
  );
};

// --- Logo Component ---
const GameLogo = () => {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback if image fails to load
    return (
      <div className="w-full max-w-[320px] mx-auto text-center p-6 border-4 border-yellow-400 rounded-2xl bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl animate-in zoom-in">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 tracking-tighter drop-shadow-sm" style={{ fontFamily: 'Arial Black, sans-serif' }}>
          SHOW DO<br/>INGLÊS
        </h1>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[350px] mx-auto animate-in zoom-in duration-700">
       <img 
         src="https://upload.wikimedia.org/wikipedia/pt/1/10/Logo_Show_do_Milh%C3%A3o.png"
         alt="Logo Show do Milhão"
         onError={() => setError(true)}
         className="relative z-10 w-full h-auto object-contain drop-shadow-2xl filter brightness-110 contrast-110 hover:scale-105 transition-transform duration-500"
       />
    </div>
  );
};

const App = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>('START');
  
  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Player & Leaderboard
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);

  // Lifelines
  const [lifelines, setLifelines] = useState<Lifelines>({ fiftyFifty: true, skips: 3, hint: true });
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // Load Leaderboard on Mount
  useEffect(() => {
    const stored = localStorage.getItem('show-ingles-leaderboard');
    if (stored) {
      try {
        setLeaderboard(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar leaderboard", e);
      }
    }
  }, []);

  // Pre-fetch Next Question Logic (Adapted for Static)
  useEffect(() => {
    const prefetch = () => {
      if (gameState === 'PLAYING' && questions.length <= currentQIndex + 1 && questions.length < PRIZE_LADDER.length) {
        const nextIndex = questions.length;
        const q = getStaticQuestion(nextIndex, usedQuestionIds);
        setQuestions(prev => [...prev, q]);
        setUsedQuestionIds(prev => [...prev, q.id]);
      }
    };
    
    prefetch();
  }, [gameState, questions.length, currentQIndex]);

  const saveScore = (prize: number) => {
    if (prize === 0) return;
    
    const newEntry: ScoreEntry = {
      name: playerName || "Anônimo",
      score: prize,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(newLeaderboard);
    localStorage.setItem('show-ingles-leaderboard', JSON.stringify(newLeaderboard));
  };

  const startGame = () => {
    if (!playerName.trim()) {
      setErrorMsg("Por favor, digite seu nome para começar.");
      return;
    }

    setGameState('LOADING');
    setErrorMsg(null);
    setQuestions([]);
    setUsedQuestionIds([]);
    
    // Simulate short loading for effect
    setTimeout(() => {
      const firstQ = getStaticQuestion(0, []);
      setQuestions([firstQ]);
      setUsedQuestionIds([firstQ.id]);
      setCurrentQIndex(0);
      setLifelines({ fiftyFifty: true, skips: 3, hint: true });
      setHiddenOptions([]);
      setActiveHint(null);
      setGameState('PLAYING');
    }, 1500);
  };

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    setGameState('FEEDBACK');
  };

  const nextQuestion = () => {
    if (gameState !== 'FEEDBACK') return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const isCorrect = selectedOption === currentQ.correctIndex;

    if (isCorrect) {
      if (currentQIndex + 1 >= PRIZE_LADDER.length) {
        const finalPrize = PRIZE_LADDER[PRIZE_LADDER.length - 1];
        saveScore(finalPrize);
        setGameState('VICTORY');
      } else {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
        setHiddenOptions([]);
        setActiveHint(null);
        setGameState('PLAYING');
      }
    } else {
      const currentPrize = currentQIndex > 0 ? PRIZE_LADDER[currentQIndex - 1] : 0;
      saveScore(currentPrize);
      setGameState('GAME_OVER');
    }
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;
    
    const correct = currentQ.correctIndex;
    const allOptions = [0, 1, 2, 3];
    const wrongOptions = allOptions.filter(i => i !== correct);
    const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    
    setHiddenOptions(toHide);
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
  };

  const useSkip = () => {
    if (lifelines.skips <= 0 || isSkipping) return;
    
    setIsSkipping(true);
    setActiveHint(null);

    // Simulate skip delay
    setTimeout(() => {
        // Replace current question with another from same level
        const currentQ = questions[currentQIndex];
        // Remove current from used IDs temporarily to allow finding a new one (though strict unique is better)
        // Ideally find a question not in usedQuestionIds with same level
        let newQuestion = getStaticQuestion(currentQIndex, usedQuestionIds);
        
        // If we got the same question (bank exhausted), just force it
        if(newQuestion.id === currentQ.id) {
           // Retry once to be sure
           newQuestion = getStaticQuestion(currentQIndex, usedQuestionIds.filter(id => id !== currentQ.id));
        }

        setQuestions(prev => {
            const updated = [...prev];
            updated[currentQIndex] = newQuestion;
            return updated;
        });
        setUsedQuestionIds(prev => [...prev, newQuestion.id]);

        setSelectedOption(null);
        setHiddenOptions([]);
        setLifelines(prev => ({ ...prev, skips: prev.skips - 1 }));
        setIsSkipping(false);
    }, 1000);
  };

  const useHint = () => {
    if (!lifelines.hint) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    setLifelines(prev => ({ ...prev, hint: false }));
    setActiveHint(currentQ.hint);
  };

  // --- Render Screens ---

  if (gameState === 'START') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="z-10 w-full max-w-4xl flex flex-col md:flex-row gap-8 items-stretch">
          
          {/* Main Card */}
          <div className="flex-1 flex flex-col items-center text-center backdrop-blur-3xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
            
            <div className="relative mb-8 group w-full flex justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
              <GameLogo />
            </div>
            
            <p className="text-slate-400 mb-8 text-lg font-light">Teste seu inglês e ganhe milhões (virtuais)!</p>
            
            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Digite seu nome..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  maxLength={15}
                />
              </div>

              <Button onClick={startGame} className="w-full text-lg py-4 shadow-violet-500/20" disabled={!playerName.trim()}>
                <Play className="fill-current" />
                JOGAR AGORA
              </Button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 text-red-200 p-4 rounded-xl mt-4 w-full border border-red-500/20 text-sm flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} className="shrink-0" />
                <span className="text-left font-medium">{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Leaderboard Card */}
          <div className="w-full md:w-80 backdrop-blur-3xl bg-slate-900/40 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <ListOrdered className="text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Top Jogadores</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {leaderboard.length === 0 ? (
                <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                  <Trophy size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Seja o primeiro a vencer!</p>
                </div>
              ) : (
                leaderboard.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                        ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                        ${idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' : ''}
                        ${idx === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' : ''}
                        ${idx > 2 ? 'bg-slate-800 text-slate-500' : ''}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm truncate max-w-[100px]">{entry.name}</span>
                        <span className="text-[10px] text-slate-500">{entry.date}</span>
                      </div>
                    </div>
                    <span className="font-mono text-green-400 font-bold text-sm">
                      ${entry.score.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-[#0f172a] to-[#0f172a]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20"></div>
            <Loader2 size={64} className="animate-spin text-violet-400 mb-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Preparando Perguntas...</h2>
          <p className="text-slate-400 animate-pulse text-center px-4">
             Organizando o desafio para <span className="text-indigo-400 font-bold">{playerName}</span>.
          </p>
        </div>
      </div>
    );
  }

  if (gameState === 'VICTORY' || gameState === 'GAME_OVER') {
    const isVictory = gameState === 'VICTORY';
    const finalPrize = isVictory 
      ? PRIZE_LADDER[PRIZE_LADDER.length - 1] 
      : (currentQIndex > 0 ? PRIZE_LADDER[currentQIndex - 1] : 0);
    
    const isHighScore = leaderboard.length > 0 && finalPrize >= leaderboard[0].score && finalPrize > 0;

    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-[#0f172a]"></div>
        
        <div className="z-10 backdrop-blur-xl bg-white/5 p-10 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl animate-in zoom-in duration-500">
          {isVictory ? (
            <div className="inline-block p-4 rounded-full bg-yellow-500/20 mb-6 animate-bounce">
              <Sparkles size={80} className="text-yellow-400" />
            </div>
          ) : (
            <div className="inline-block p-4 rounded-full bg-red-500/20 mb-6">
              <XCircle size={80} className="text-red-400" />
            </div>
          )}
          
          <h2 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
            {isVictory ? "LENDÁRIO!" : "FIM DE JOGO"}
          </h2>
          
          <p className="text-slate-400 text-lg mb-6">
            Belo jogo, <span className="text-white font-bold">{playerName}</span>!
          </p>

          <div className="my-8 py-6 bg-slate-900/50 rounded-2xl border border-white/5">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Prêmio Total</p>
            <p className="text-5xl font-mono font-bold text-green-400 drop-shadow-lg">
              ${finalPrize.toLocaleString()}
            </p>
            {isHighScore && (
              <div className="mt-2 inline-flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-3 py-1 rounded-full">
                <Trophy size={12} /> NOVO RECORDE
              </div>
            )}
          </div>
          
          <Button onClick={() => setGameState('START')} variant="secondary" className="w-full">
            <RefreshCw size={20} /> Jogar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Handle waiting for next question
  const currentQ = questions[currentQIndex];
  
  // If we are playing but the question hasn't loaded yet
  if (!currentQ && gameState === 'PLAYING') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-400 mb-4" />
        <p className="text-indigo-200 font-bold animate-pulse">Carregando pergunta...</p>
      </div>
    );
  }

  const isFeedback = gameState === 'FEEDBACK';
  const progressPercent = ((currentQIndex) / PRIZE_LADDER.length) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative font-sans overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur opacity-40 rounded-full"></div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner relative z-10 border border-white/10">
                {currentQIndex + 1}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Questão</span>
              <span className="text-xs text-slate-300 font-medium">de {PRIZE_LADDER.length}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <User size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 max-w-[100px] truncate">{playerName}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Valendo</span>
             <div className="font-mono text-green-400 font-bold text-2xl flex items-center gap-1 drop-shadow-sm">
               <span className="text-green-600">$</span>
               {PRIZE_LADDER[currentQIndex].toLocaleString()}
             </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-24 flex flex-col justify-center gap-6 relative z-10">
        
        {/* Question Card */}
        <div className="bg-white/5 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group">
           {isSkipping && (
             <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300">
               <Loader2 size={48} className="animate-spin text-indigo-400 mb-2" />
               <p className="text-indigo-200 font-bold animate-pulse">Trocando pergunta...</p>
             </div>
           )}
           
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <HelpCircle size={100} />
           </div>

           {/* Level Badge */}
           <div className="flex items-center gap-2 mb-4">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
               {currentQ.level === 'easy' ? 'Nível Básico' : currentQ.level === 'medium' ? 'Nível Médio' : currentQ.level === 'hard' ? 'Nível Difícil' : 'Nível Especialista'}
             </div>
           </div>
           
           <h2 className="text-xl sm:text-3xl font-bold leading-relaxed text-slate-100 relative z-10 drop-shadow-sm">
             {currentQ.text}
           </h2>

           {/* Hint Bubble */}
           {activeHint && (
             <div className="mt-6 bg-yellow-950/60 border border-yellow-500/30 p-4 rounded-xl flex gap-4 animate-in fade-in slide-in-from-left-4">
               <div className="bg-yellow-500/20 p-2 rounded-lg h-fit">
                 <Lightbulb className="text-yellow-300" size={20} />
               </div>
               <div>
                 <p className="text-yellow-200 text-sm italic leading-relaxed">"{activeHint}"</p>
                 <p className="text-[10px] text-yellow-400 mt-1 font-bold uppercase tracking-wider">Dica</p>
               </div>
             </div>
           )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((option, idx) => {
            if (hiddenOptions.includes(idx)) return <div key={idx} className="h-[72px] sm:h-[80px]" />; 

            let variant: 'primary' | 'secondary' | 'correct' | 'wrong' = 'secondary';
            if (isFeedback) {
              if (idx === currentQ.correctIndex) variant = 'correct';
              else if (idx === selectedOption) variant = 'wrong';
              else variant = 'secondary';
            } else if (selectedOption === idx) {
              variant = 'primary';
            }

            return (
              <button
                key={idx}
                onClick={() => !isFeedback && handleAnswer(idx)}
                disabled={isFeedback || isSkipping}
                className={`
                  w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden select-none touch-manipulation
                  ${variant === 'secondary' 
                    ? 'bg-slate-800/60 border-white/5 hover:bg-slate-700/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10' 
                    : ''}
                  ${variant === 'primary' 
                    ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-900/50 scale-[1.02]' 
                    : ''}
                  ${variant === 'correct' 
                    ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-900/20' 
                    : ''}
                  ${variant === 'wrong' 
                    ? 'bg-red-900/40 border-red-500/50 text-red-100 opacity-60' 
                    : ''}
                `}
              >
                {/* Hover gradient effect */}
                {variant === 'secondary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/10 to-indigo-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <span className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-colors shrink-0
                    ${variant === 'secondary' ? 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-300' : 'bg-black/20 border-white/20 text-white'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg sm:text-xl font-medium">{option}</span>
                </div>
                
                <div className="relative z-10 shrink-0 ml-2">
                  {variant === 'correct' && <CheckCircle2 className="text-emerald-400 animate-in zoom-in duration-300" size={24} />}
                  {variant === 'wrong' && <XCircle className="text-red-400 animate-in zoom-in duration-300" size={24} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback / Controls */}
        {isFeedback && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Explicação</p>
                 <p className="text-white text-sm sm:text-base leading-snug">{currentQ.explanation}</p>
              </div>
              <Button onClick={nextQuestion} className="w-full sm:w-auto min-w-[200px]" variant={selectedOption === currentQ.correctIndex ? "correct" : "wrong"}>
                {selectedOption === currentQ.correctIndex ? "Continuar" : "Ver Resultado"} <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Lifelines Footer */}
      {!isFeedback && (
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/5 p-4 z-40">
          <div className="max-w-2xl mx-auto flex justify-center gap-3 sm:gap-6">
            <LifelineButton 
              icon={<Divide size={20} />} 
              label="50:50" 
              active={lifelines.fiftyFifty && !isSkipping} 
              onClick={useFiftyFifty} 
            />
            <LifelineButton 
              icon={isSkipping ? <Loader2 size={20} className="animate-spin" /> : <FastForward size={20} />} 
              label={isSkipping ? "..." : "Pular"} 
              count={lifelines.skips}
              active={lifelines.skips > 0 && !isSkipping} 
              onClick={useSkip} 
            />
            <LifelineButton 
              icon={<Brain size={20} />} 
              label="Dica" 
              active={lifelines.hint && !isSkipping} 
              onClick={useHint} 
            />
          </div>
        </footer>
      )}
    </div>
  );
};

const LifelineButton = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  count 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  count?: number 
}) => (
  <button
    onClick={onClick}
    disabled={!active}
    className={`
      flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[80px] transition-all duration-300 relative group overflow-hidden touch-manipulation
      ${active 
        ? 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 border border-white/5' 
        : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-transparent'}
    `}
  >
    <div className={`mb-1 transition-transform group-hover:scale-110 ${active ? 'text-indigo-400 group-hover:text-white' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    
    {/* Badge for Count */}
    {count !== undefined && (
      <div className={`
        absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900
        ${active ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}
      `}>
        {count}
      </div>
    )}
  </button>
);

const root = createRoot(document.getElementById('app')!);
root.render(<App />);