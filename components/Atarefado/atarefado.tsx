import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type AtarefadoProps = {
    nome: string;
    tarefa: string;
    };

    export default function Atarefados({nome, tarefa}: AtarefadoProps) {
        
        return(
            <View style= {styles.box}>
                <Text style={styles.name}>{nome}</Text>
                
                <Text style={styles.tarefa}>{tarefa}</Text>             

            </View>
        );

    }

    const styles = StyleSheet.create({
        box: {
            backgroundColor: 'white',
            alignItems: 'center',
            padding: 20,
            margin: 20,
            borderRadius: 5,
        },
        name: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        tarefa: {
            fontSize: 20,
            fontWeight: 'bold',
        },
    });
