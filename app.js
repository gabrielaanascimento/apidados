// app.js - API para receber e listar dados de sistema
const express = require('express');
const { Pool } = require('pg');
const env = require('dotenv').config()
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());

const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
        return;
    }
    client.release();
    console.log('✅ Conexão bem-sucedida com o PostgreSQL.');
});

app.post('/api/sistema', async (req, res) => {

    const { computador, informacoes, descricao } = req.body;

    if (!computador || typeof computador !== 'string' || 
        !informacoes || typeof informacoes !== 'object' || Array.isArray(informacoes) || informacoes === null ||
        !descricao || typeof descricao !== 'string') {
        
        console.warn('Requisição POST recebida com dados inválidos.');
        return res.status(400).json({ 
            error: 'Dados inválidos. O corpo da requisição deve conter "computador" (string), "informacoes" (objeto JSON) e "descricao" (string).' 
        });
    }

    const informacoes_json = JSON.stringify(informacoes);

    try {
        const query = `
            INSERT INTO system_data (computer_name, information_description, information_data)
            VALUES ($1, $2, $3)
            RETURNING id, received_at;
        `;

        const values = [computador, descricao, informacoes_json]; 

        const result = await pool.query(query, values);
        
        console.log(`✅ Dados genéricos salvos com sucesso. Descrição: ${descricao}`);
        
        res.status(201).json({
            message: 'Dados de sistema salvos com sucesso!',
            id: result.rows[0].id,
            receivedAt: result.rows[0].received_at
        });

    } catch (err) {
        console.error('❌ Erro ao inserir dados no banco de dados:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados.' });
    }
});

app.get('/api/sistema', async (req, res) => {
    try {

        const query = `
            SELECT id, computer_name, information_description, information_data, received_at 
            FROM system_data
            ORDER BY received_at DESC;
        `;
        
        const result = await pool.query(query);
        
        const dadosFormatados = result.rows.map(row => ({
            id: row.id,
            computerName: row.computer_name,
            description: row.information_description,
            receivedAt: row.received_at,
            informationData: row.information_data
        }));

        console.log(`✅ Rota GET acessada. Retornando ${dadosFormatados.length} registros.`);
        res.status(200).json(dadosFormatados);

    } catch (err) {
        console.error('❌ Erro ao buscar dados no banco de dados:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar dados.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor Node.js rodando em http://localhost:${port}`);
    console.log(`Rota POST para salvar dados: POST http://localhost:${port}/api/sistema`);
    console.log(`Rota GET para listar dados: GET http://localhost:${port}/api/sistema`);
});